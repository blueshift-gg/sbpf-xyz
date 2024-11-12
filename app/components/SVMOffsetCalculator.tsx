"use client";

import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Menu, Download, Upload, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account, ACCOUNT_TYPES, AccountEntryProps, Language, Project, ProjectSidebarProps } from '../types';
import Logo from './Logo';
import OffsetDisplay from './OffsetDisplay';

const AUTOSAVE_DELAY = 1000; // 1 second delay for autosave

const ProjectSidebar = ({ isOpen, onClose, projects, currentProject, onSelectProject, onImport }: ProjectSidebarProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          onImport(JSON.parse(e.target?.result as string) as Project);
        } catch (error) {
          console.error('Failed to parse project file:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`fixed left-0 top-0 h-full w-64 bg-background border-r border-border transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} z-50`}>
      <div className="p-4 flex justify-between items-center border-b border-border">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden"
        />
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Project
        </Button>
        <div className="space-y-2">
          {projects.map(project => (
            <Button
              key={project.id}
              variant={currentProject?.id === project.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => onSelectProject(project)}
            >
              {project.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AccountEntry = ({ account, index, updateAccount, removeAccount }: AccountEntryProps) => (
  <div className="flex items-center gap-4 p-4 bg-background/5 rounded-lg border border-border">
    <div className="flex-1 grid grid-cols-3 gap-4">
      <Input
        placeholder="Account name"
        value={account.name}
        onChange={(e) => updateAccount(index, { ...account, name: e.target.value })}
        className="bg-background"
      />
      <Select
        value={account.type}
        onValueChange={(value: keyof typeof ACCOUNT_TYPES) => updateAccount(index, { 
          ...account, 
          type: value,
          dataLength: ACCOUNT_TYPES[value]
        })}
      >
        <SelectTrigger className="bg-background">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(ACCOUNT_TYPES).map(type => (
            <SelectItem key={type} value={type}>{type}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        placeholder="Data length"
        min="0"
        value={account.dataLength}
        onChange={(e) => updateAccount(index, { 
          ...account, 
          dataLength: parseInt(e.target.value) 
        })}
        className="bg-background"
      />
    </div>
    <Button 
      variant="destructive" 
      size="icon"
      onClick={() => removeAccount(index)}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

const SVMOffsetCalculator = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [language, setLanguage] = useState<Language>('ASM');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('svm-projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // Autosave current project
  useEffect(() => {
    if (currentProject) {
      const saveTimeout = setTimeout(() => {
        const updatedProject: Project = {
          ...currentProject,
          accounts,
        };
        const updatedProjects = projects.map((p: Project) => 
          p.id === currentProject.id ? updatedProject : p
        );
        setProjects(updatedProjects);
        localStorage.setItem('svm-projects', JSON.stringify(updatedProjects));
      }, AUTOSAVE_DELAY);

      return () => clearTimeout(saveTimeout);
    }
  }, [accounts, language, currentProject, projects]);

  const addAccount = () => {
    const newAccount: Account = {
      name: `ACCOUNT${accounts.length + 1}`,
      type: 'System' as keyof typeof ACCOUNT_TYPES,
      dataLength: 0
    };
    setAccounts([...accounts, newAccount]);
  };
  
  const updateAccount = (index: number, updatedAccount: Account) => {
    const updatedAccounts = [...accounts];
    updatedAccounts[index] = updatedAccount;
    setAccounts(updatedAccounts);
  };
  
  const removeAccount = (index: number) => {
    const updatedAccounts = accounts.filter((_, i) => i !== index);
    setAccounts(updatedAccounts);
  };

  const exportProject = () => {
    const projectData = {
      name: currentProject?.name || 'Untitled Project',
      accounts
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectData.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Project Name"
              value={currentProject?.name || ''}
              onChange={(e) => {
                if (currentProject) {
                  setCurrentProject({
                    ...currentProject,
                    name: e.target.value
                  });
                } else {
                  // Create a new project if none exists
                  setCurrentProject({
                    id: Date.now(),
                    name: e.target.value,
                    accounts: [],
                    language: language
                  });
                }
              }}
              className="w-48 bg-background"
            />
            <Button onClick={exportProject}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={projects}
        currentProject={currentProject}
        onSelectProject={(project) => {
          setCurrentProject(project);
          setAccounts(project.accounts);
          setLanguage(project.language);
          setIsSidebarOpen(false);
        }}
        onImport={(projectData) => {
          const newProject = {
            ...projectData
          };
          setProjects([...projects, newProject]);
          setCurrentProject(newProject);
          setAccounts(projectData.accounts);
          setLanguage(projectData.language);
          setIsSidebarOpen(false);
        }}
      />

      <main className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-4xl mx-auto bg-background/40">
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
            {accounts.map((account, index) => (
              <AccountEntry
                key={index}
                index={index}
                account={account}
                updateAccount={updateAccount}
                removeAccount={removeAccount}
              />
            ))}
            </div>
            
            <div className="flex gap-4 items-center">
              <Button onClick={addAccount} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Account
              </Button>
            </div>
            <div className="flex flex-col">
              <Tabs 
                  value={language} 
                  onValueChange={(value) => { setLanguage(value as Language) }} 
                  className="flex-1 "
                >
                  <TabsList className="bg-black grid grid-cols-3 h-10 pb-0 mb-0 rounded-b-none">
                    <TabsTrigger className="rounded-b-none h-10 data-[state=active]:bg-gray-700 data-[state=active]:text-white" value="ASM">ASM</TabsTrigger>
                    <TabsTrigger className="rounded-b-none h-10 data-[state=active]:bg-gray-700 data-[state=active]:text-white" value="Rust">Rust</TabsTrigger>
                    <TabsTrigger className="rounded-b-none h-10 data-[state=active]:bg-gray-700 data-[state=active]:text-white" value="C">C</TabsTrigger>
                  </TabsList>
              </Tabs>
              <OffsetDisplay
                accounts={accounts}
                language={language}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SVMOffsetCalculator;