import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search,
  Download,
  Box,
  Clock,
  RefreshCw,
  Play,
  HardDrive,
  ArrowLeft,
  X,
  Plus,
} from "lucide-react";

interface Image {
  id: string;
  name: string;
  tag: string;
  size: string;
  pulled: string;
  source: 'local' | 'registry';
  description: string;
}

interface CreateCubePayload {
  name: string;
  image: string;
  tag: string;
  ports: string;
  environment: string;
  volumes: string;
}

interface ImagesListPageProps {
  pageNavigator: (page: string) => void;
}

interface EnvironmentVariable {
  key: string;
  value: string;
}

interface Volume {
  host: string;
  container: string;
}

interface Port {
  host: string;
  container: string;
}

const ImagesList: React.FC<ImagesListPageProps> = ({ pageNavigator }) => {
  const [images, setImages] = useState<Image[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPullDialog, setShowPullDialog] = useState(false);
  const [_, setSelectedImage] = useState<Image | null>(null);
  const [filter, setFilter] = useState<'all' | 'local' | 'registry'>('all');
  const [newImage, setNewImage] = useState('');
  const [newTag, setNewTag] = useState('latest');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resourceLimits, setResourceLimits] = useState({
    cpus: "1.0",
    memory: "512M"
  });
  const [containerForm, setContainerForm] = useState<CreateCubePayload>({
    name: '',
    image: '',
    tag: '',
    ports: '',
    environment: '',
    volumes: ''
  });

  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([{ key: '', value: '' }]);
  const [volumes, setVolumes] = useState<Volume[]>([{ host: '', container: '' }]);
  const [ports, setPorts] = useState<Port[]>([{ host: '', container: '' }]);
  const handleAddPort = () => {
    setPorts([...ports, { host: '', container: '' }]);
  };

  const handleRemovePort = (index: number) => {
    const newPorts = [...ports];
    newPorts.splice(index, 1);
    setPorts(newPorts);
  };

  const handlePortChange = (index: number, field: 'host' | 'container', value: string) => {
    const newPorts = [...ports];
    newPorts[index][field] = value;
    setPorts(newPorts);
  };

  const handleAddEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    const newEnvVars = [...envVars];
    newEnvVars.splice(index, 1);
    setEnvVars(newEnvVars);
  };

  const handleEnvVarChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);
  };

  const handleAddVolume = () => {
    setVolumes([...volumes, { host: '', container: '' }]);
  };

  const handleRemoveVolume = (index: number) => {
    const newVolumes = [...volumes];
    newVolumes.splice(index, 1);
    setVolumes(newVolumes);
  };

  const handleVolumeChange = (index: number, field: 'host' | 'container', value: string) => {
    const newVolumes = [...volumes];
    newVolumes[index][field] = value;
    setVolumes(newVolumes);
  };

  useEffect(() => {
    localStorage.setItem('selectedPage',"ImagesList");
    fetch('http://localhost:8080/api/repo/local')
      .then(response => response.json())
      .then(data => {
        const allImages = [ ...data.custom_images].map((img: any, index: number) => ({
          id: (index + 1).toString(),
          name: img.image,
          tag: img.tag,
          size: img.size,
          pulled: new Date(img.Pulled_on).toISOString().split('T')[0],
          source: 'local' as 'local' | 'registry',
          description: img.desc
        }));
        setImages(allImages);
      })
      .catch(error => console.error('Error fetching images:', error));
  }, []);

  const filteredImages = images.filter(image => {
    const matchesSearch = image.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          image.tag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || image.source === filter;
    return matchesSearch && matchesFilter;
  });

  const handleCreateContainer = async () => {
    try {
      const portsArray = ports
      .filter(port => port.host && port.container)
      .map(port => `${port.host}:${port.container}`);

    // Convert environment variables to array format
    const envArray = envVars
      .filter(env => env.key && env.value)
      .map(env => `${env.key}=${env.value}`);

    // Convert volumes to object format
    const volumesObj: { [key: string]: string } = {};
    volumes.forEach(vol => {
      if (vol.host && vol.container) {
        volumesObj[vol.host] = vol.container;
      }
    });

    // If no volumes specified, use default
    if (Object.keys(volumesObj).length === 0) {
      volumesObj[`[DEFAULT]/${containerForm.name}`] = '/home/coder/workspace';
    }

    const workspaceId = localStorage.getItem('selectedWorkspaceId');
    if (workspaceId) {
      const workspaceIdInt = parseInt(workspaceId);
  
      const payload = {
        workspace_id: workspaceIdInt,
        cube_data: {
          name: containerForm.name,
          image: `${containerForm.image}:${containerForm.tag}`,
          ports: portsArray,
          environment_vars: envArray,
          resource_limits: resourceLimits,
          volumes: volumesObj,
          labels: [`workspace_id=${workspaceIdInt}`, "service=turplespace"],
         
        }
      };

        const response = await fetch('http://localhost:8080/api/cube', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
  
        if (response.ok) {
          setSuccessMessage('Cube created successfully!');
          setTimeout(() => setSuccessMessage(null), 3000);
          setShowCreateDialog(false);
          setContainerForm({
            name: '',
            image: '',
            tag: '',
            ports: '',
            environment: '',
            volumes: ''
          });
        } else {
          const errorData = await response.json();
          console.error('Error creating Cube:', errorData);
          setSuccessMessage('Failed to create Cube: ' + (errorData.message || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error creating Cube:', error);
      setSuccessMessage('Failed to create Cube: Network error');
    }
  };


  return (
    <div className="container mx-auto p-4">
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
          {successMessage}
        </div>
      )}
      
      <Button variant="outline" onClick={() => pageNavigator("CubesPage")}>
        <ArrowLeft className="mr-2 w-4 h-4" /> Back
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{images.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Images</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {images.filter(img => img.source === 'local').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repo Images</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {images.filter(img => img.source === 'registry').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filter === 'local' ? 'default' : 'outline'}
                onClick={() => setFilter('local')}
                size="sm"
              >
                Custom
              </Button>
              <Button
                variant={filter === 'registry' ? 'default' : 'outline'}
                onClick={() => setFilter('registry')}
                size="sm"
              >
                Registry
              </Button>
            </div>
            <Button onClick={() => setShowPullDialog(true)}>
              <Download className="h-4 w-4 mr-2" /> Pull Image
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cube Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {filteredImages.map((image) => (
              <Card key={image.id} className="bg-secondary/20">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{image.name}</h3>
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-200 text-blue-800">
                          {image.tag}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800">
                          {image.source}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{image.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-4 w-4" /> {image.size}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" /> Pulled: {image.pulled}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedImage(image);
                          setContainerForm({
                            ...containerForm,
                            image: image.name,
                            tag: image.tag
                          });
                          setShowCreateDialog(true);
                        }}
                      >
                        <Play className="h-4 w-4 mr-1" /> Create Cube
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowPullDialog(true);
                          setNewImage(image.name);
                          setNewTag(image.tag);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" /> Pull Latest
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPullDialog} onOpenChange={setShowPullDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pull Container Image</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Image Name</label>
              <Input
                placeholder="e.g., nginx"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tag</label>
              <Input
                placeholder="e.g., latest"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPullDialog(false)}>
              Cancel
            </Button>
            <Button>
              Pull Image
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Create Cube</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6">
          <div className="grid gap-4 py-4">
            {/* Cube Name */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Cube Name*</label>
              <Input
                placeholder="Enter Cube name"
                value={containerForm.name}
                onChange={(e) => setContainerForm({...containerForm, name: e.target.value})}
                required
              />
              <span className="text-xs text-gray-500">
                This will also be used for the default volume path if none is specified
              </span>
            </div>

            {/* Image */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Image</label>
              <Input value={containerForm.image} disabled />
            </div>

            {/* Ports */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Ports</label>
              <div className="space-y-2">
                {ports.map((port, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Host Port"
                      value={port.host}
                      onChange={(e) => handlePortChange(index, 'host', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Container Port"
                      value={port.container}
                      onChange={(e) => handlePortChange(index, 'container', e.target.value)}
                      className="flex-1"
                    />
                    {ports.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemovePort(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPort}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Port
                </Button>
              </div>
              <span className="text-xs text-gray-500">
                Default: 80:80
              </span>
            </div>

            {/* Environment Variables */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Environment Variables</label>
              <div className="space-y-2">
                {envVars.map((env, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Key"
                      value={env.key}
                      onChange={(e) => handleEnvVarChange(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={env.value}
                      onChange={(e) => handleEnvVarChange(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    {envVars.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveEnvVar(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddEnvVar}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Environment Variable
                </Button>
              </div>
            </div>

            {/* Volumes */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Volumes</label>
              <div className="space-y-2">
                {volumes.map((volume, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Host Path"
                      value={volume.host}
                      onChange={(e) => handleVolumeChange(index, 'host', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Container Path"
                      value={volume.container}
                      onChange={(e) => handleVolumeChange(index, 'container', e.target.value)}
                      className="flex-1"
                    />
                    {volumes.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveVolume(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVolume}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Volume
                </Button>
              </div>
              <span className="text-xs text-gray-500">
                Default: /home/dharshan/portos_backend/bin/turplecube_volumes/{containerForm.name}:/workspace
              </span>
            </div>

            {/* Resource Limits */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">CPU Limit</label>
              <Input
                placeholder="e.g., 1.0"
                value={resourceLimits.cpus}
                onChange={(e) => setResourceLimits({...resourceLimits, cpus: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Memory Limit</label>
              <Input
                placeholder="e.g., 512M"
                value={resourceLimits.memory}
                onChange={(e) => setResourceLimits({...resourceLimits, memory: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="flex justify-end gap-2 p-6 pt-2 border-t">
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateContainer}
            disabled={!containerForm.name}
          >
            Create Cube
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    

    </div>
  );
};

export default ImagesList;