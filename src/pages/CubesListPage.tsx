import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Server, 
  Play, 
  Pause, 
  Trash2, 
  RefreshCw, 
  MoreHorizontal,
  CloudUpload,
  ArrowLeft
} from "lucide-react";

// Container interface with simplified structure
interface Container {
  container_id: number;
  service_name: string;
  image: string;
  container_name: string;
  status: 'running' | 'stopped' | 'paused' | 'error';
  ip_address: string;
}

interface CubesListPageProps {
  pageNavigator: (page: string) => void;
}

const CubesListPage: React.FC<CubesListPageProps> = ({ pageNavigator }) => {
  const [containers, setContainers] = useState<Container[]>([]);

  useEffect(() => {
    localStorage.setItem('selectedPage',"CubesPage");
    const workspaceId = localStorage.getItem('selectedWorkspaceId');
    if (workspaceId) {
      fetch(`http://localhost:8080/api/cubes?workspace_id=${workspaceId}`)
        .then(response => response.json())
        .then(data => {
          if (data) {
            setContainers(data.map((container: any) => ({
              container_id: container.container_id,
              service_name: container.service_name,
              container_name: container.container_name,
              image: container.image,
              status: container.status,
              ip_address: container.ip_address || "N/A"
            })));
          }
        })
        .catch(error => console.error('Error fetching containers:', error));
    }
  }, []);

  // Render status badge
  const renderStatusBadge = (status: Container['status']) => {
    const badgeVariants = {
      running: 'bg-green-500 text-white',
      stopped: 'bg-red-500 text-white',
      paused: 'bg-yellow-500 text-white',
      error: 'bg-red-700 text-white'
    };

    return (
      <Badge variant="outline" className={badgeVariants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Action handlers
  const handleContainerAction = (
    action: 'start' | 'stop' | 'redeploy' | 'delete', 
    containerId: number
  ) => {
    const urlMap = {
      start: `http://localhost:8080/api/cube/deploy?cube_id=${containerId}`,
      stop: `http://localhost:8080/api/cube/stop?cube_id=${containerId}`,
      redeploy: `http://localhost:8080/api/cube/redeploy?cube_id=${containerId}`,
      delete: `http://localhost:8080/api/cube/delete?cube_id=${containerId}`
    };

    fetch(urlMap[action], {
      method: action === "delete" ? 'DELETE' : 'POST'
    })
      .then(response => response.json())
      .then(data => {
        if (data.message.includes("successfully")) {
          if (action === 'delete') {
            setContainers(prevContainers => 
              prevContainers.filter(container => container.container_id !== containerId)
            );
          } else {
            setContainers(prevContainers => 
              prevContainers.map(container => {
                if (container.container_id === containerId) {
                  switch(action) {
                    case 'start':
                    case 'redeploy':
                      return { ...container, status: 'running' };
                    case 'stop':
                      return { ...container, status: 'stopped' };
                  }
                }
                return container;
              })
            );
          }
        } else {
          console.error(`Failed to ${action} container`);
        }
      })
      .catch(error => console.error(`Error performing ${action} action:`, error));
  };

  const handleContainerClick = (container: Container) => {
    
    localStorage.setItem('selectedContainerId', container.container_id.toString());
    pageNavigator("CubeDashboard");
  };

  return (
    <div className="container mx-auto p-4">
      <Button variant="outline" onClick={() => pageNavigator("WorkspaceDashboard")}>
        <ArrowLeft className="mr-2 w-4 h-4" /> Back
      </Button>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-2">
            <Server className="w-6 h-6" />
            <CardTitle>Docker Cubes</CardTitle>
          </div>
          <Button variant="outline">
            <RefreshCw className="mr-2 w-4 h-4" /> Refresh
          </Button>
          <Button variant="outline" onClick={() => pageNavigator("ImagesList")}>
            Add Cube
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers.map((container) => (
                <TableRow key={container.container_id} >
                  <TableCell onClick={() => handleContainerClick(container)}>{container.container_name}</TableCell>
                  <TableCell onClick={() => handleContainerClick(container)}>{container.image}</TableCell>
                  <TableCell onClick={() => handleContainerClick(container)}>
                    {renderStatusBadge(container.status)}
                  </TableCell>
                  <TableCell onClick={() => handleContainerClick(container)}>{container.ip_address}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {/* Deploy/Redeploy Button */}
                        <DropdownMenuItem 
                          onSelect={() => handleContainerAction('redeploy', container.container_id)}
                          className="cursor-pointer"
                        >
                          <CloudUpload className="mr-2 w-4 h-4" /> Redeploy
                        </DropdownMenuItem>

                        {/* Start Button (Show when not running) */}
                        {container.status !== 'running' && (
                          <DropdownMenuItem 
                            onSelect={() => handleContainerAction('start', container.container_id)}
                            className="cursor-pointer"
                          >
                            <Play className="mr-2 w-4 h-4" /> Start
                          </DropdownMenuItem>
                        )}

                        {/* Stop Button (Show when running) */}
                        {container.status === 'running' && (
                          <DropdownMenuItem 
                            onSelect={() => handleContainerAction('stop', container.container_id)}
                            className="cursor-pointer"
                          >
                            <Pause className="mr-2 w-4 h-4" /> Stop
                          </DropdownMenuItem>
                        )}

                        {/* Delete Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()} 
                              className="cursor-pointer text-red-500"
                            >
                              <Trash2 className="mr-2 w-4 h-4" /> Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the Cube {container.container_name}. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleContainerAction('delete', container.container_id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {containers.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No Cubes found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CubesListPage;