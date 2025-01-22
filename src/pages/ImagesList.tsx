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

  useEffect(() => {
    localStorage.setItem('selectedPage',"ImagesList");
    fetch('http://localhost:8080/api/images')
      .then(response => response.json())
      .then(data => {
        const allImages = [...data.repo_images, ...data.custom_images].map((img: any, index: number) => ({
          id: (index + 1).toString(),
          name: img.image,
          tag: img.tag,
          size: img.size,
          pulled: new Date(img.Pulled_on).toISOString().split('T')[0],
          source: data.repo_images.includes(img) ? 'registry' : 'local' as 'local' | 'registry',
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
      // Parse ports from string to array
      const portsArray = containerForm.ports
        ? containerForm.ports.split(',').map(p => p.trim())
        : []; // Default port if none specified
  
      // Parse environment variables from string to array
      const envArray = containerForm.environment
        ? containerForm.environment.split(',').map(e => e.trim())
        : [];
  
      // Set up volumes with default if none specified
      let volumesObj: { [key: string]: string } = {};
      if (containerForm.volumes) {
        containerForm.volumes.split(',').forEach(v => {
          const [host, container] = v.trim().split(':');
          if (host && container) {
            volumesObj[host] = container;
          }
        });
      } else {
        // Default volume mapping using container name
        volumesObj[`[DEFAULT]/${containerForm.name}`] = '/workspace';
      }
  
      const workspaceId = localStorage.getItem('selectedWorkspaceId');
      if (workspaceId) {
        const workspaceIdInt = parseInt(workspaceId);
    
        const payload = {
          workspace_id: workspaceIdInt,
          cubes: [{
            name: containerForm.name,
            image: `${containerForm.image}:${containerForm.tag}`,
            ports: portsArray,
            environment_vars: envArray,
            resource_limits: resourceLimits,
            volumes: volumesObj,
            labels: [`workspace_id=${workspaceIdInt}`, "service=turplespace"],
            force: true  // Add force flag to create container even if it doesn't exist
          }]
        };
  
        const response = await fetch('http://localhost:8080/api/cube/add', {
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Cube</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
          <div className="grid gap-2">
            <label className="text-sm font-medium">Image</label>
            <Input value={containerForm.image} disabled />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Ports (host:container)</label>
            <Input
              placeholder="e.g., 80:80, 443:443 (default: 80:80)"
              value={containerForm.ports}
              onChange={(e) => setContainerForm({...containerForm, ports: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Environment Variables</label>
            <Input
              placeholder="e.g., KEY1=value1,KEY2=value2"
              value={containerForm.environment}
              onChange={(e) => setContainerForm({...containerForm, environment: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Volumes</label>
            <Input
              placeholder="e.g., /host/path:/container/path"
              value={containerForm.volumes}
              onChange={(e) => setContainerForm({...containerForm, volumes: e.target.value})}
            />
            <span className="text-xs text-gray-500">
              Default: /home/dharshan/portos_backend/bin/turplecube_volumes/{containerForm.name}:/workspace
            </span>
          </div>
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
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateContainer}
            disabled={!containerForm.name} // Disable if no name is provided
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