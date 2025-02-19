import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Server, 
  Cpu, 
  MemoryStick, 
  Play,
  RotateCw,
  Square,
  Save,
  Edit,
  ArrowLeft,
  Code,
  Globe
} from "lucide-react";

interface WorkspaceConfig {
  image: string;
  container_name: string;
  ports: string[];
  ip_address: string;
  environment_vars: string[] | null;
  volumes: { [key: string]: string };
  labels: string[];
  deploy: {
    resources: {
      limits: {
        cpus: string;
        memory: string;
        swap: string;
      }
    }
  };
  networks: string[];
  status: 'running' | 'stopped' | 'deploying';
  service_name: string;
}

const INITIAL_WORKSPACE: WorkspaceConfig = {
  image: '',
  container_name: '',
  ports: [],
  ip_address: '',
  environment_vars: [],
  volumes: {},
  labels: [],
  deploy: {
    resources: {
      limits: {
        cpus: '',
        memory: '',
        swap: ''
      }
    }
  },
  networks: [],
  status: 'stopped',
  service_name: ''
};

interface CubeDashboardProps {
  pageNavigator: (page: string) => void;
}

const CubeDashboard: React.FC<CubeDashboardProps> = ({ pageNavigator }) => {
  const [workspace, setWorkspace] = useState<WorkspaceConfig>(INITIAL_WORKSPACE);
  const [isEditing, setIsEditing] = useState(false);
  const [editedWorkspace, setEditedWorkspace] = useState<WorkspaceConfig>(INITIAL_WORKSPACE);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);
  const [commitForm, setCommitForm] = useState({
    image: '',
    tag: ''
  });
  const [isDevContainer,setIsDevContainer] = useState(false)
  useEffect(() => {
    localStorage.setItem('selectedPage',"CubeDashboard");
    const containerId = localStorage.getItem('selectedContainerId');
    if (containerId) {
      fetchContainerData(containerId);
    }
  }, []);

  const fetchContainerData = (containerId: string) => {
    setIsLoading(true);
    fetch(`http://localhost:8080/api/cube/${containerId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        const workspaceData: WorkspaceConfig = {
          image: data.container_data.image || '',
          container_name: data.container_data.name || '',
          ports: data.container_data.ports || [],
          ip_address: data.ip_address || '',
          environment_vars: data.container_data.environment_vars || [],
          volumes: data.container_data.volumes || {},
          labels: data.container_data.labels || [],
          deploy: {
            resources: {
              limits: {
                cpus: data.container_data.resource_limits?.cpus || '',
                memory: data.container_data.resource_limits?.memory || '',
                swap: data.container_data.resource_limits?.swap || ''
              }
            }
          },
          networks: data.container_data.networks || [],
          status: data.status || 'stopped',
          service_name: data.container_data.service_name || ''
        };

        if (workspaceData.image.split(":")[1]=='dev'){
          setIsDevContainer(true)
        }
      
        setWorkspace(workspaceData);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching container data:', error);
        setIsLoading(false);
      });
  };


  const handleCommitDialogOpen = () => {
    setCommitForm({
      image: '',
      tag: ''
    });
    setIsCommitDialogOpen(true);
  };

  const handleCommit = () => {
    const containerId = localStorage.getItem('selectedContainerId');
    
    if (!commitForm.image || !commitForm.tag) {
      alert('Please enter both image name and tag');
      return;
    }
  if (containerId) {
    fetch(`http://localhost:8080/api/cube/${containerId}/commit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: commitForm.image,
      tag: commitForm.tag
    })
    })
    .then(response => {
    if (!response.ok) {
      return response.text().then(text => { throw new Error(text) });
    }
    return response.json();
    })
    .then(() => {
    alert('Container committed successfully!');
    setIsCommitDialogOpen(false);
    })
    .catch(error => {
    console.error('Error committing container:', error);
    alert('Failed to commit container: ' + error.message);
    });
  }
  };

  const handleDeploy = () => {
    const containerId = localStorage.getItem('selectedContainerId');
    if (containerId) {
      setWorkspace(prev => ({ ...prev, status: 'deploying' })); // Show deploying state immediately
      
      fetch(`http://localhost:8080/api/cube/${containerId}/deploy`, {
        method: 'POST'
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Deployment failed');
        }
        return response.json();
      })
      .then(() => {
        setWorkspace(prev => ({ 
          ...prev, 
          status: 'running',
        }));
      })
      .catch(error => {
        console.error('Error deploying container:', error);
        setWorkspace(prev => ({ ...prev, status: 'stopped' })); // Revert on error
        // Optionally show error message to user
        alert('Failed to deploy container: ' + error.message);
      });
    }
  };
  
  const handleStop = () => {
    const containerId = localStorage.getItem('selectedContainerId');
    if (containerId) {
      fetch(`http://localhost:8080/api/cube/${containerId}/stop`, {
        method: 'POST'
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to stop container');
        }
        return response.json();
      })
      .then(() => {
        setWorkspace(prev => ({ 
          ...prev, 
          status: 'stopped',
        }));
      })
      .catch(error => {
        console.error('Error stopping container:', error);
        // Optionally show error message to user
        alert('Failed to stop container: ' + error.message);
      });
    }
  };
  
  const handleRedeploy = () => {
    const containerId = localStorage.getItem('selectedContainerId');
    if (containerId) {
      setWorkspace(prev => ({ ...prev, status: 'deploying' })); // Show deploying state immediately
      
      fetch(`http://localhost:8080/api/cube/${containerId}/redeploy`, {
        method: 'POST'
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Redeployment failed');
        }
        return response.json();
      })
      .then(() => {
        setWorkspace(prev => ({ 
          ...prev, 
          status: 'running',
        }));
      })
      .catch(error => {
        console.error('Error redeploying container:', error);
        setWorkspace(prev => ({ ...prev, status: 'stopped' })); // Revert on error
        // Optionally show error message to user
        alert('Failed to redeploy container: ' + error.message);
      });
    }
  };
  
  const handleSaveEdit = () => {
    const containerId = localStorage.getItem('selectedContainerId');
    if (containerId) {
      const updatedCube = {
        name: editedWorkspace.container_name,
        image: editedWorkspace.image,
        environment_vars: editedWorkspace.environment_vars,
        resource_limits: {
          cpus: editedWorkspace.deploy.resources.limits.cpus,
          memory: editedWorkspace.deploy.resources.limits.memory
        },
        volumes: editedWorkspace.volumes,
        labels: editedWorkspace.labels,
        service_name: editedWorkspace.service_name,
        ports: editedWorkspace.ports
      };
  
      fetch(`http://localhost:8080/api/cube/${containerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updated_cube: updatedCube
        })
      })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
      })
      .then(() => {
        setWorkspace(prev => ({
          ...prev,
          ...editedWorkspace,
          status: prev.status // Preserve the current status
        }));
        setIsEditing(false);
        alert('Changes saved successfully!');
      })
      .catch(error => {
        console.error('Error updating container:', error.message);
        alert('Failed to save changes: ' + error.message);
      });
    }
  };

  const handleEdit = () => {
    setEditedWorkspace(workspace);
    setIsEditing(true);
  };
  const handleCode = () => {
    const url =  `http://${workspace.ip_address}:8080`;
    // Open the URL in a new tab
    window.open(url, '_blank');
  }
  const handleInputChange = (field: string, value: string) => {
    setEditedWorkspace(prev => ({
      ...prev,
      [field]: field === 'volumes' ? Object.fromEntries(value.split(',').map(item => item.split(':'))) : value.split(',')
    }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Button variant="outline" onClick={() => pageNavigator("CubesPage")}>
        <ArrowLeft className="mr-2 w-4 h-4" /> Back
      </Button>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cube Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{workspace.status}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IP Address</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspace.ip_address || 'N/A'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Limit</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspace.deploy.resources.limits.cpus || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Limit</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspace.deploy.resources.limits.memory || 'N/A'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Port Mappings</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspace.ports.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Container Details Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cube Configuration</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleEdit} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            {
              isDevContainer ?<Button onClick={handleCode} variant="outline" size="sm">
              <Code className="h-4 w-4 mr-1" /> Code
            </Button>:""
            }
            
            <Button
              onClick={handleDeploy}
              disabled={workspace.status === 'running'}
              size="sm"
            >
              <Play className="h-4 w-4 mr-1" /> Deploy
            </Button>
            <Button
              onClick={handleRedeploy}
              disabled={workspace.status === 'stopped'}
              size="sm"
            >
              <RotateCw className="h-4 w-4 mr-1" /> Redeploy
            </Button>
            <Button
              onClick={handleStop}
              disabled={workspace.status === 'stopped'}
              variant="secondary"
              size="sm"
            >
              <Square className="h-4 w-4 mr-1" /> Stop
            </Button>
            <Button
        onClick={handleCommitDialogOpen}
        variant="outline"
        size="sm"
      >
        <Save className="h-4 w-4 mr-1" /> Commit
      </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Basic Information</h3>
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Image:</span>
                    <span className="font-medium">{workspace.image}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cube Name:</span>
                    <span className="font-medium">{workspace.container_name}</span>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div>
                <h3 className="font-medium mb-2">Resource Limits</h3>
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPUs:</span>
                    <span className="font-medium">{workspace.deploy.resources.limits.cpus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Memory:</span>
                    <span className="font-medium">{workspace.deploy.resources.limits.memory} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Swap:</span>
                    <span className="font-medium">{workspace.deploy.resources.limits.swap} MB</span>
                  </div>
                </div>
              </div>

              {/* Networks */}
              <div>
                <h3 className="font-medium mb-2">Networks</h3>
                <div className="space-y-1">
                  {workspace.networks.map((network, index) => (
                    <div key={index} className="text-sm p-1 bg-secondary/20 rounded">
                      {network}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Configuration */}
            <div className="space-y-4">
              {/* Ports */}
              <div>
                <h3 className="font-medium mb-2">Port Mappings</h3>
                <div className="grid gap-1">
                  {workspace.ports.map((port, index) => (
                    <div key={index} className="text-sm p-1 bg-secondary/20 rounded">
                      {port}
                    </div>
                  ))}
                </div>
              </div>

              {/* Environment Variables */}
              <div>
                <h3 className="font-medium mb-2">Environment Variables</h3>
                <div className="grid gap-1">
                  {workspace.environment_vars && workspace.environment_vars.map((env, index) => (
                    <div key={index} className="text-sm p-1 bg-secondary/20 rounded">
                      {env}
                    </div>
                  ))}
                </div>
              </div>

              {/* Volumes */}
              <div>
                <h3 className="font-medium mb-2">Volumes</h3>
                <div className="grid gap-1">
                  {Object.entries(workspace.volumes).map(([volume, path], index) => (
                    <div key={index} className="text-sm p-1 bg-secondary/20 rounded">
                      {volume}: {path}
                    </div>
                  ))}
                </div>
              </div>

              {/* Labels */}
              <div>
                <h3 className="font-medium mb-2">Labels</h3>
                <div className="grid gap-1">
                  {workspace.labels.map((label, index) => (
                    <div key={index} className="text-sm p-1 bg-secondary/20 rounded">
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Cube Configuration</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Container Name</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={editedWorkspace.container_name}
                onChange={(e) => {
                  setEditedWorkspace(prev => ({
                    ...prev,
                    container_name: e.target.value
                  }));
                }}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Image</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={editedWorkspace.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Ports (comma-separated)</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={editedWorkspace.ports.join(',')}
                onChange={(e) => handleInputChange('ports', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Environment Variables (comma-separated)</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={editedWorkspace.environment_vars ? editedWorkspace.environment_vars.join(',') : ''}
                onChange={(e) => handleInputChange('environment_vars', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Volumes (key1:value1, key2:value2)</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={Object.entries(editedWorkspace.volumes).map(([key, value]) => `${key}:${value}`).join(',')}
                onChange={(e) => handleInputChange('volumes', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Labels (comma-separated)</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={editedWorkspace.labels ? editedWorkspace.labels.join(',') : ''}
                onChange={(e) => handleInputChange('labels', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">CPU Limit</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={editedWorkspace.deploy.resources.limits.cpus}
                onChange={(e) => {
                  setEditedWorkspace(prev => ({
                    ...prev,
                    deploy: {
                      ...prev.deploy,
                      resources: {
                        ...prev.deploy.resources,
                        limits: {
                          ...prev.deploy.resources.limits,
                          cpus: e.target.value
                        }
                      }
                    }
                  }));
                }}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Memory Limit</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={editedWorkspace.deploy.resources.limits.memory}
                onChange={(e) => {
                  setEditedWorkspace(prev => ({
                    ...prev,
                    deploy: {
                      ...prev.deploy,
                      resources: {
                        ...prev.deploy.resources,
                        limits: {
                          ...prev.deploy.resources.limits,
                          memory: e.target.value
                        }
                      }
                    }
                  }));
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Commit Dialog */}
      <Dialog open={isCommitDialogOpen} onOpenChange={setIsCommitDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Commit Container</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Image Name</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={commitForm.image}
                onChange={(e) => setCommitForm(prev => ({ ...prev, image: e.target.value }))}
                placeholder="Enter image name"
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tag</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={commitForm.tag}
                onChange={(e) => setCommitForm(prev => ({ ...prev, tag: e.target.value }))}
                placeholder="Enter tag"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCommitDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCommit}>
                Commit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CubeDashboard;
