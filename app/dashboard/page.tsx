"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Plus, Settings, Trash2, ExternalLink, LogOut } from "lucide-react"
import Link from "next/link"

type Project = {
  id: string
  project_hash: string
  name: string
  template_type: 'omni-wheel' | 'mecanum-wheel'
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [username, setUsername] = useState<string>("Guest")
  const [isGuest, setIsGuest] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: "",
    templateType: "omni-wheel" as 'omni-wheel' | 'mecanum-wheel',
    motorFL: "frontLeft",
    motorFR: "frontRight",
    motorBL: "backLeft",
    motorBR: "backRight",
  })

  useEffect(() => {
    // Enable guest mode if not authenticated
    if (!authLoading) {
      if (user) {
        setIsGuest(false)
        loadProjects()
        loadUserProfile()
      } else {
        // Guest mode
        setIsGuest(true)
        setUsername("Guest")
        loadGuestProjects()
      }
    }
  }, [user, authLoading])

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('id', user!.id)
        .single()

      if (error) throw error
      setUsername(data.username)
    } catch (err: any) {
      console.error('Error loading profile:', err)
    }
  }

  const loadProjects = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err: any) {
      setError(err.message || "Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  const loadGuestProjects = () => {
    try {
      setLoading(true)
      if (typeof window !== 'undefined') {
        const savedProjects = localStorage.getItem('guestProjects')
        if (savedProjects) {
          setProjects(JSON.parse(savedProjects))
        }
      }
    } catch (err: any) {
      console.error('Error loading guest projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveGuestProjects = (updatedProjects: Project[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guestProjects', JSON.stringify(updatedProjects))
    }
  }

  const generateProjectHash = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const handleCreateProject = async () => {
    try {
      const maxProjects = 3
      if (projects.length >= maxProjects) {
        setError("You can only create up to 3 projects")
        return
      }

      setError(null)
      const projectHash = generateProjectHash()

      // Guest mode - save to localStorage
      if (isGuest) {
        const newProject: Project = {
          id: projectHash,
          project_hash: projectHash,
          name: createFormData.name || "Untitled Project",
          template_type: createFormData.templateType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const updatedProjects = [...projects, newProject]
        setProjects(updatedProjects)
        saveGuestProjects(updatedProjects)
        setShowCreateDialog(false)
        setCreateFormData({
          name: "",
          templateType: "omni-wheel",
          motorFL: "frontLeft",
          motorFR: "frontRight",
          motorBL: "backLeft",
          motorBR: "backRight",
        })

        // Enable guest mode in session and navigate
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('guestMode', 'true')
        }
        router.push(`/dashboard/guest/${projectHash}`)
        return
      }

      // Authenticated mode - save to database
      const motorConfig = {
        fl: createFormData.motorFL,
        fr: createFormData.motorFR,
        bl: createFormData.motorBL,
        br: createFormData.motorBR,
      }

      const { error } = await supabase.from('projects').insert({
        user_id: user!.id,
        project_hash: projectHash,
        name: createFormData.name,
        template_type: createFormData.templateType,
        motor_config: motorConfig,
        workflow_data: {},
      })

      if (error) throw error

      setShowCreateDialog(false)
      setCreateFormData({
        name: "",
        templateType: "omni-wheel",
        motorFL: "frontLeft",
        motorFR: "frontRight",
        motorBL: "backLeft",
        motorBR: "backRight",
      })
      loadProjects()

      router.push(`/dashboard/${username}/${projectHash}`)
    } catch (err: any) {
      setError(err.message || "Failed to create project")
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      if (isGuest) {
        // Guest mode - remove from localStorage
        const updatedProjects = projects.filter(p => p.id !== projectId)
        setProjects(updatedProjects)
        saveGuestProjects(updatedProjects)
        return
      }

      // Authenticated mode - delete from database
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      loadProjects()
    } catch (err: any) {
      setError(err.message || "Failed to delete project")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Failed to sign out")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  const maxProjects = 3

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(226, 232, 240, 0.12), transparent 60%), #000000",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              My Projects
            </h1>
            <p className="text-muted-foreground mt-1">
              Create up to 3 robot code projects
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/50 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Project Card */}
          {projects.length < maxProjects && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Card className="border-dashed border-2 border-border/50 bg-background/50 hover:bg-background/80 transition-colors cursor-pointer h-[240px] flex items-center justify-center">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold text-white">Create New Project</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {maxProjects - projects.length} slot{maxProjects - projects.length !== 1 ? 's' : ''} remaining
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="bg-background/95 backdrop-blur-sm border-border/50 max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Choose a template and configure your robot's motor setup
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      placeholder="My Awesome Robot"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template">Robot Template</Label>
                    <Select
                      value={createFormData.templateType}
                      onValueChange={(value: 'omni-wheel' | 'mecanum-wheel') =>
                        setCreateFormData({ ...createFormData, templateType: value })
                      }
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="omni-wheel">4 Omni-Wheel Drive</SelectItem>
                        <SelectItem value="mecanum-wheel">4 Mecanum-Wheel Drive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Motor Configuration</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="motorFL" className="text-xs text-muted-foreground">Front Left</Label>
                        <Input
                          id="motorFL"
                          placeholder="fl"
                          value={createFormData.motorFL}
                          onChange={(e) => setCreateFormData({ ...createFormData, motorFL: e.target.value })}
                          className="bg-background/50 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="motorFR" className="text-xs text-muted-foreground">Front Right</Label>
                        <Input
                          id="motorFR"
                          placeholder="fr"
                          value={createFormData.motorFR}
                          onChange={(e) => setCreateFormData({ ...createFormData, motorFR: e.target.value })}
                          className="bg-background/50 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="motorBL" className="text-xs text-muted-foreground">Back Left</Label>
                        <Input
                          id="motorBL"
                          placeholder="bl"
                          value={createFormData.motorBL}
                          onChange={(e) => setCreateFormData({ ...createFormData, motorBL: e.target.value })}
                          className="bg-background/50 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="motorBR" className="text-xs text-muted-foreground">Back Right</Label>
                        <Input
                          id="motorBR"
                          placeholder="br"
                          value={createFormData.motorBR}
                          onChange={(e) => setCreateFormData({ ...createFormData, motorBR: e.target.value })}
                          className="bg-background/50 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject} disabled={!createFormData.name}>
                    Create Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Existing Projects */}
          {loading ? (
            <p className="text-muted-foreground col-span-full text-center py-12">Loading projects...</p>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all h-[240px] flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription>
                    {project.template_type === 'omni-wheel' ? '4 Omni-Wheel Drive' : '4 Mecanum-Wheel Drive'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/${isGuest ? 'guest' : username}/${project.project_hash}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {projects.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects yet. Create your first robot code project!</p>
          </div>
        )}
      </div>
    </div>
  )
}
