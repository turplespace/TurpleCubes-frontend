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
import { Globe, Plus, Trash2, Edit2, Play } from "lucide-react";

interface ProxyConfig {
  id: number;
  domain: string;
  port: number;
  type: string;
  default: boolean;
}

interface ProxyFormData {
  domain: string;
  port: number;
  type: string;
  default: boolean;
}

interface ProxyManagementProps {
  cubeId: string;
}

const ProxyManagement: React.FC<ProxyManagementProps> = ({ cubeId }) => {
  const [proxies, setProxies] = useState<ProxyConfig[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProxy, setSelectedProxy] = useState<ProxyConfig | null>(null);
  const [formData, setFormData] = useState<ProxyFormData>({
    domain: '',
    port: 80,
    type: 'http',
    default: false
  });

  useEffect(() => {
    fetchProxies();
  }, [cubeId]);

  const fetchProxies = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/proxy/by-cube/${cubeId}`);
      if (!response.ok) throw new Error('Failed to fetch proxies');
      const data = await response.json();
      
      setProxies(Array.isArray(data) ? data : [data]);
      console.log(proxies)
    } catch (error) {
      console.error('Error fetching proxies:', error);
    }
  };

  const handleAddProxy = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cube_id: parseInt(cubeId),
          ...formData
        }),
      });

      if (!response.ok) throw new Error('Failed to add proxy');
      
      setIsAddDialogOpen(false);
      fetchProxies();
      resetForm();
    } catch (error) {
      console.error('Error adding proxy:', error);
      alert('Failed to add proxy');
    }
  };

  const handleEditProxy = async () => {
    if (!selectedProxy) return;

    try {
      const response = await fetch(`http://localhost:8080/api/proxy/${selectedProxy.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update proxy');
      
      setIsEditDialogOpen(false);
      fetchProxies();
      resetForm();
    } catch (error) {
      console.error('Error updating proxy:', error);
      alert('Failed to update proxy');
    }
  };

  const handleDeleteProxy = async (proxyId: number) => {
    if (!confirm('Are you sure you want to delete this proxy?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/proxy/${proxyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete proxy');
      
      fetchProxies();
    } catch (error) {
      console.error('Error deleting proxy:', error);
      alert('Failed to delete proxy');
    }
  };

  const handleDeleteAllProxies = async () => {
    if (!confirm('Are you sure you want to delete all proxies for this cube?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/proxy/by-cube/${cubeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete all proxies');
      
      fetchProxies();
    } catch (error) {
      console.error('Error deleting all proxies:', error);
      alert('Failed to delete all proxies');
    }
  };

  const handleDeployProxy = async (proxyId: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/proxy/${proxyId}/deploy`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to deploy proxy');
      
      alert('Proxy deployed successfully');
    } catch (error) {
      console.error('Error deploying proxy:', error);
      alert('Failed to deploy proxy');
    }
  };

  const resetForm = () => {
    setFormData({
      domain: '',
      port: 80,
      type: 'http',
      default: false
    });
    setSelectedProxy(null);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Proxy Management
        </CardTitle>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Proxy
          </Button>
          {proxies.length > 0 && (
            <Button onClick={handleDeleteAllProxies} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> Delete All
            </Button>
          )}
        </div>
      </CardHeader>
      

    <CardContent>
    <div className="grid gap-4">
        {proxies.map((proxy) => (
        proxy && (
            <div key={proxy.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
            <div className="space-y-1">
                <div className="font-medium">{proxy.domain}</div>
                <div className="text-sm text-muted-foreground">
                Port: {proxy.port} | Type: {proxy.type}
                {proxy.default && ' | Default'}
                </div>
            </div>
            <div className="flex gap-2">
                <Button
                onClick={() => handleDeployProxy(proxy.id)}
                size="sm"
                variant="outline"
                >
                <Play className="h-4 w-4 mr-1" /> Deploy
                </Button>
                <Button
                onClick={() => {
                    setSelectedProxy(proxy);
                    setFormData({
                    domain: proxy.domain,
                    port: proxy.port,
                    type: proxy.type,
                    default: proxy.default
                    });
                    setIsEditDialogOpen(true);
                }}
                size="sm"
                variant="outline"
                >
                <Edit2 className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button
                onClick={() => handleDeleteProxy(proxy.id)}
                size="sm"
                variant="destructive"
                >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
            </div>
            </div>
        )
        ))}

        {proxies.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
            No proxies configured for this cube
        </div>
        )}
    </div>
    </CardContent>



      {/* Add Proxy Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Proxy</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Domain</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={formData.domain}
                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                placeholder="example.com"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Port</label>
              <input
                type="number"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={formData.port}
                onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Type</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="tcp">TCP</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="default"
                checked={formData.default}
                onChange={(e) => setFormData(prev => ({ ...prev, default: e.target.checked }))}
              />
              <label htmlFor="default" className="text-sm font-medium">Set as default proxy</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}>Cancel</Button>
              <Button onClick={handleAddProxy}>Add Proxy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Proxy Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Proxy</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Domain</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={formData.domain}
                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                placeholder="example.com"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Port</label>
              <input
                type="number"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={formData.port}
                onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Type</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="tcp">TCP</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="default-edit"
                checked={formData.default}
                onChange={(e) => setFormData(prev => ({ ...prev, default: e.target.checked }))}
              />
              <label htmlFor="default-edit" className="text-sm font-medium">Set as default proxy</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}>Cancel</Button>
              <Button onClick={handleEditProxy}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProxyManagement;