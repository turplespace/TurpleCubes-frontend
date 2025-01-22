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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Play,
  RotateCw,
  Square,
  Trash2,
  MoreVertical,
  Plus,
  Boxes,
  Power,
  Box,
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'stopped' | 'partial';
  totalContainers: number;
  runningContainers: number;
  createdAt: string;
}

interface WorkspacesListProps {
  pageNavigator: (page: string) => void;
}

const WorkspacesList: React.FC<WorkspacesListProps> = ({ pageNavigator }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [totalWorkspaces, setTotalWorkspaces] = useState(0);
  const [totalCubes, setTotalCubes] = useState(0);
  const [totalRunningCubes, setTotalRunningCubes] = useState(0);
  const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: ''
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('selectedPage',"WorkspaceDashboard");
    // Fetch workspaces from the API
    fetch('http://localhost:8080/api/workspaces')
      .then(response => response.json())
      .then(data => {
        if (data && data.workspaces) {
          setWorkspaces(data.workspaces.map((workspace: any) => ({
            id: workspace.id.toString(),
            name: workspace.name,
            description: workspace.desc,
            status: workspace.running_containers > 0 ? (workspace.running_containers < workspace.total_containers ? 'partial' : 'running') : 'stopped',
            totalContainers: workspace.total_containers,
            runningContainers: workspace.running_containers,
            createdAt: new Date(workspace.created_at).toISOString().split('T')[0]
          })));
          setTotalWorkspaces(data.total_workspaces);
          setTotalCubes(data.total_cubes);
          setTotalRunningCubes(data.total_running_cubes);
        }
      })
      .catch(error => console.error('Error fetching workspaces:', error));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-200 text-green-800';
      case 'stopped':
        return 'bg-red-200 text-red-800';
      case 'partial':
        return 'bg-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const handleDeploy = (workspaceId: string) => {
    fetch(`http://localhost:8080/api/workspace/deploy?workspace_id=${workspaceId}`, {
      method: 'POST'
    })
      .then(response => response.json())
      .then(data => {
        if (data.message === "Workspace deployed successfully") {
          setWorkspaces(workspaces.map(workspace =>
            workspace.id === workspaceId
              ? {
                  ...workspace,
                  status: 'running',
                  runningContainers: workspace.totalContainers
                }
              : workspace
          ));
          setSuccessMessage(data.message);
        } else {
          setErrorMessage("Failed to deploy workspace");
        }
      })
      .catch(error => {
        console.error('Error deploying workspace:', error);
        setErrorMessage("Failed to deploy workspace");
      });
  };

  const handleRedeploy = (workspaceId: string) => {
    fetch(`http://localhost:8080/api/workspace/redeploy?workspace_id=${workspaceId}`, {
      method: 'POST'
    })
      .then(response => response.json())
      .then(data => {
        if (data.message === "Workspace redeployed successfully") {
          setWorkspaces(workspaces.map(workspace =>
            workspace.id === workspaceId
              ? {
                  ...workspace,
                  status: 'running',
                  runningContainers: workspace.totalContainers
                }
              : workspace
          ));
          setSuccessMessage(data.message);
        } else {
          setErrorMessage("Failed to redeploy workspace");
        }
      })
      .catch(error => {
        console.error('Error redeploying workspace:', error);
        setErrorMessage("Failed to redeploy workspace");
      });
  };

  const handleStop = (workspaceId: string) => {
    fetch(`http://localhost:8080/api/workspace/stop?workspace_id=${workspaceId}`, {
      method: 'POST'
    })
      .then(response => response.json())
      .then(data => {
        if (data.message === "Workspace stopped successfully") {
          setWorkspaces(workspaces.map(workspace =>
            workspace.id === workspaceId
              ? {
                  ...workspace,
                  status: 'stopped',
                  runningContainers: 0
                }
              : workspace
          ));
          setSuccessMessage(data.message);
        } else {
          setErrorMessage("Failed to stop workspace");
        }
      })
      .catch(error => {
        console.error('Error stopping workspace:', error);
        setErrorMessage("Failed to stop workspace");
      });
  };

  const handleDelete = (workspaceId: string) => {
    fetch(`http://localhost:8080/api/workspace/delete?id=${workspaceId}`, {
      method: 'DELETE'
    })
      .then(response => response.json())
      .then(() => {
        setWorkspaces(workspaces.filter(workspace => workspace.id !== workspaceId));
      })
      .catch(error => console.error('Error deleting workspace:', error));
  };

  const handleCreateWorkspace = () => {
    fetch('http://localhost:8080/api/workspace/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: newWorkspace.name,
        desc: newWorkspace.description,
        containers: []
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === "Workspace created successfully") {
        setSuccessMessage(data.message);

        // Optionally, you can fetch the updated list of workspaces from the server
        fetch('http://localhost:8080/api/workspaces')
          .then(response => response.json())
          .then(data => {
            if (data && data.workspaces) {
              setWorkspaces(data.workspaces.map((workspace: any) => ({
                id: workspace.id.toString(),
                name: workspace.name,
                description: workspace.desc,
                status: workspace.running_containers > 0 ? (workspace.running_containers < workspace.total_containers ? 'partial' : 'running') : 'stopped',
                totalContainers: workspace.total_containers,
                runningContainers: workspace.running_containers,
                createdAt: new Date(workspace.created_at).toISOString().split('T')[0]
              })));
              setTotalWorkspaces(data.total_workspaces);
              setTotalCubes(data.total_cubes);
              setTotalRunningCubes(data.total_running_cubes);
            }
          })
          .catch(error => console.error('Error fetching workspaces:', error));
      }

      setNewWorkspace({ name: '', description: '' });
      setShowNewWorkspaceDialog(false);
    })
    .catch(error => console.error('Error creating workspace:', error));
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    // Store the selected workspace in local storage
    localStorage.setItem('selectedWorkspace', JSON.stringify(workspace));
    // Store the workspace ID in local storage
    localStorage.setItem('selectedWorkspaceId', workspace.id);
    // Navigate to the "Cubes" page
    pageNavigator("CubesPage");
  };

  return (
    <div className="container mx-auto p-4">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
          {errorMessage}
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workspaces</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkspaces}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Cubes</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRunningCubes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cubes</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCubes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Workspaces List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Workspaces</CardTitle>
          <Button onClick={() => setShowNewWorkspaceDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Workspace
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {workspaces.map((workspace) => (
              <Card 
                key={workspace.id} 
                className="bg-secondary/20" 
                onClick={() => handleWorkspaceClick(workspace)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{workspace.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(workspace.status)}`}>
                          {workspace.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{workspace.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {workspace.createdAt}</span>
                        <span>Containers: {workspace.totalContainers}</span>
                        <span>Running: {workspace.runningContainers}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDeploy(workspace.id); }}
                        disabled={workspace.status === 'running'}
                      >
                        <Play className="h-4 w-4 mr-1" /> Deploy
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleRedeploy(workspace.id); }}
                        disabled={workspace.status === 'stopped'}
                      >
                        <RotateCw className="h-4 w-4 mr-1" /> Redeploy
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); handleStop(workspace.id); }}
                        disabled={workspace.status === 'stopped'}
                      >
                        <Square className="h-4 w-4 mr-1" /> Stop
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => { e.stopPropagation(); handleDelete(workspace.id); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Workspace Dialog */}
      <Dialog open={showNewWorkspaceDialog} onOpenChange={setShowNewWorkspaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Workspace Name
              </label>
              <input
                id="name"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={newWorkspace.name}
                onChange={(e) => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter workspace name"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <input
                id="description"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={newWorkspace.description}
                onChange={(e) => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter workspace description"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewWorkspaceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkspace}>
              Create Workspace
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkspacesList;