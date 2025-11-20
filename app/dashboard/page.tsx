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
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Plus, Settings, Trash2, ExternalLink, LogOut, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DriveTrainSelector } from "@/components/drivetrain-selector"
import { DriveTrainType, DRIVETRAIN_DEFINITIONS } from "@/lib/drivetrain-types"

type Project = {
  id: string
  project_hash: string
  name: string
  template_type: DriveTrainType
  motor_config?: any
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
  const [createStep, setCreateStep] = useState<'drivetrain' | 'config'>('drivetrain')
  const [username, setUsername] = useState<string>("User")
  const [createFormData, setCreateFormData] = useState({
    name: "",
    templateType: "omni-wheel" as DriveTrainType,
    motors: {
      motorFL: { name: "frontLeft", port: 0, hub: "control" as "control" | "expansion" },
      motorFR: { name: "frontRight", port: 1, hub: "control" as "control" | "expansion" },
      motorBL: { name: "backLeft", port: 2, hub: "control" as "control" | "expansion" },
      motorBR: { name: "backRight", port: 3, hub: "control" as "control" | "expansion" },
      motorCL: { name: "centerStrafe", port: 0, hub: "expansion" as "control" | "expansion" },
    }
  })

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadProjects()
        loadUserProfile()
      } else {
        // Redirect to signin if not authenticated
        router.push('/signin')
      }
    }
  }, [user, authLoading])

  const loadUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load profile')
      }

      const data = await response.json()
      setUsername(data.username || 'User')
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setUsername('User')
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


  const generateProjectHash = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const syncUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false

      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      return response.ok
    } catch (err) {
      console.error('Error syncing user profile:', err)
      return false
    }
  }

  const handleCreateProject = async () => {
    try {
      setError(null)
      const projectHash = generateProjectHash()

      // Prepare motor configuration
      const motorConfig: any = {
        fl: createFormData.motors.motorFL,
        fr: createFormData.motors.motorFR,
        bl: createFormData.motors.motorBL,
        br: createFormData.motors.motorBR,
      }

      // Add additional motors for H-Drive
      if (createFormData.templateType === 'h-drive') {
        motorConfig.cl = createFormData.motors.motorCL
      }

      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Use API endpoint which handles user profile creation if needed
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: createFormData.name,
          templateType: createFormData.templateType,
          motorConfig: motorConfig,
          projectHash: projectHash,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      // Reset form and navigate
      setShowCreateDialog(false)
      setCreateStep('drivetrain')
      setCreateFormData({
        name: "",
        templateType: "omni-wheel",
        motors: {
          motorFL: { name: "frontLeft", port: 0, hub: "control" },
          motorFR: { name: "frontRight", port: 1, hub: "control" },
          motorBL: { name: "backLeft", port: 2, hub: "control" },
          motorBR: { name: "backRight", port: 3, hub: "control" },
          motorCL: { name: "centerStrafe", port: 0, hub: "expansion" },
        }
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
      // Delete from database
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
              Create unlimited robot code projects
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
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Card className="border-dashed border-2 border-border/50 bg-background/50 hover:bg-background/80 transition-colors cursor-pointer h-[240px] flex items-center justify-center">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold text-white">Create New Project</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start building your robot code
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="bg-background/95 backdrop-blur-sm border-border/50 max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>
                    {createStep === 'drivetrain' ? 'Choose Drive Train' : 'Configure Project'}
                  </DialogTitle>
                  <DialogDescription>
                    {createStep === 'drivetrain'
                      ? 'Select a drive train type for your robot'
                      : 'Name your project and configure motor settings'}
                  </DialogDescription>
                </DialogHeader>

                {createStep === 'drivetrain' ? (
                  <div className="flex-1 overflow-y-auto py-4 px-1">
                    <DriveTrainSelector
                      selectedType={createFormData.templateType}
                      onSelect={(type) => setCreateFormData({ ...createFormData, templateType: type })}
                    />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto py-4 px-1">
                    <div className="space-y-4 max-w-2xl mx-auto">
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
                      <Label>Selected Drive Train</Label>
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="font-semibold text-white">
                          {DRIVETRAIN_DEFINITIONS[createFormData.templateType].name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {DRIVETRAIN_DEFINITIONS[createFormData.templateType].description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base">Motor Configuration</Label>
                      <p className="text-xs text-muted-foreground">
                        Configure motor names and assign them to hardware ports
                      </p>
                      <div className="space-y-4">
                        {/* Motor FL */}
                        <div className="p-3 rounded-lg border border-border/50 bg-zinc-900/30 space-y-2">
                          <Label className="text-sm font-semibold">
                            {createFormData.templateType === 'tank-drive' ? 'Left Front Motor' : 'Front Left Motor'}
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-3 sm:col-span-1">
                              <Label htmlFor="motorFL-name" className="text-xs text-muted-foreground">Motor Name</Label>
                              <Input
                                id="motorFL-name"
                                placeholder={createFormData.templateType === 'tank-drive' ? "leftFront" : "frontLeft"}
                                value={createFormData.motors.motorFL.name}
                                onChange={(e) => setCreateFormData({
                                  ...createFormData,
                                  motors: {
                                    ...createFormData.motors,
                                    motorFL: { ...createFormData.motors.motorFL, name: e.target.value }
                                  }
                                })}
                                className="bg-background/50 mt-1 h-9"
                              />
                            </div>
                            <div>
                              <Label htmlFor="motorFL-port" className="text-xs text-muted-foreground">Port</Label>
                              <Select
                                value={createFormData.motors.motorFL.port.toString()}
                                onValueChange={(value) => setCreateFormData({
                                  ...createFormData,
                                  motors: {
                                    ...createFormData.motors,
                                    motorFL: { ...createFormData.motors.motorFL, port: parseInt(value) }
                                  }
                                })}
                              >
                                <SelectTrigger className="bg-background/50 mt-1 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">Port 0</SelectItem>
                                  <SelectItem value="1">Port 1</SelectItem>
                                  <SelectItem value="2">Port 2</SelectItem>
                                  <SelectItem value="3">Port 3</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="motorFL-hub" className="text-xs text-muted-foreground">Hub</Label>
                              <Select
                                value={createFormData.motors.motorFL.hub}
                                onValueChange={(value: "control" | "expansion") => setCreateFormData({
                                  ...createFormData,
                                  motors: {
                                    ...createFormData.motors,
                                    motorFL: { ...createFormData.motors.motorFL, hub: value }
                                  }
                                })}
                              >
                                <SelectTrigger className="bg-background/50 mt-1 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="control">Control</SelectItem>
                                  <SelectItem value="expansion">Expansion</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Motor FR */}
                        <div className="p-3 rounded-lg border border-border/50 bg-zinc-900/30 space-y-2">
                          <Label className="text-sm font-semibold">
                            {createFormData.templateType === 'tank-drive' ? 'Right Front Motor' : 'Front Right Motor'}
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-3 sm:col-span-1">
                              <Label htmlFor="motorFR-name" className="text-xs text-muted-foreground">Motor Name</Label>
                              <Input
                                id="motorFR-name"
                                placeholder={createFormData.templateType === 'tank-drive' ? "rightFront" : "frontRight"}
                                value={createFormData.motors.motorFR.name}
                                onChange={(e) => setCreateFormData({
                                  ...createFormData,
                                  motors: {
                                    ...createFormData.motors,
                                    motorFR: { ...createFormData.motors.motorFR, name: e.target.value }
                                  }
                                })}
                                className="bg-background/50 mt-1 h-9"
                              />
                            </div>
                            <div>
                              <Label htmlFor="motorFR-port" className="text-xs text-muted-foreground">Port</Label>
                              <Select
                                value={createFormData.motors.motorFR.port.toString()}
                                onValueChange={(value) => setCreateFormData({
                                  ...createFormData,
                                  motors: {
                                    ...createFormData.motors,
                                    motorFR: { ...createFormData.motors.motorFR, port: parseInt(value) }
                                  }
                                })}
                              >
                                <SelectTrigger className="bg-background/50 mt-1 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">Port 0</SelectItem>
                                  <SelectItem value="1">Port 1</SelectItem>
                                  <SelectItem value="2">Port 2</SelectItem>
                                  <SelectItem value="3">Port 3</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="motorFR-hub" className="text-xs text-muted-foreground">Hub</Label>
                              <Select
                                value={createFormData.motors.motorFR.hub}
                                onValueChange={(value: "control" | "expansion") => setCreateFormData({
                                  ...createFormData,
                                  motors: {
                                    ...createFormData.motors,
                                    motorFR: { ...createFormData.motors.motorFR, hub: value }
                                  }
                                })}
                              >
                                <SelectTrigger className="bg-background/50 mt-1 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="control">Control</SelectItem>
                                  <SelectItem value="expansion">Expansion</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Motor BL */}
                        <div className="p-3 rounded-lg border border-border/50 bg-zinc-900/30 space-y-2">
                          <Label className="text-sm font-semibold">
                            {createFormData.templateType === 'tank-drive' ? 'Left Back Motor' : 'Back Left Motor'}
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-3 sm:col-span-1">
                              <Label htmlFor="motorBL-name" className="text-xs text-muted-foreground">Motor Name</Label>
                              <Input
                                id="motorBL-name"
                                placeholder={createFormData.templateType === 'tank-drive' ? "leftBack" : "backLeft"}
                                value={createFormData.motors.motorBL.name}
                                onChange={(e) => setCreateFormData({
                                  ...createFormData,
                                  motors: {
                                    ...createFormData.motors,
                                    motorBL: { ...createFormData.motors.motorBL, name: e.target.value }
                                  }
                                })}
                                className="bg-background/50 mt-1 h-9"
                              />
                            </div>
                            <div>
                              <Label htmlFor="motorBL-port" className="text-xs text-muted-foreground">Port</Label>
                              <Select
                                value={createFormData.motors.motorBL.port.toString()}
                                onValueChange={(value) => setCreateFormData({
                                  ...createFormData,
                                  motors: {
                                    ...createFormData.motors,
                                    motorBL: { ...createFormData.motors.motorBL, port: parseInt(value) }
                                  }
                                })}
                              >
                                <SelectTrigger className="bg-background/50 mt-1 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">Port 0</SelectItem>
                                  <SelectItem value="1">Port 1</SelectItem>
                                  <SelectItem value="2">Port 2</SelectItem>
                                  <SelectItem value="3">Port 3</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="motorBL-hub" className="text-xs text-muted-foreground">Hub</Label>
                              <Select
                                value={createFormData.motors.motorBL.hub}
                                onValueChange={(value: "control" | "expansion") => setCreateFormData({
                                  ...createFormData,
                                  motors: {
                                    ...createFormData.motors,
                                    motorBL: { ...createFormData.motors.motorBL, hub: value }
                                  }
                                })}
                              >
                                <SelectTrigger className="bg-background/50 mt-1 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="control">Control</SelectItem>
                                  <SelectItem value="expansion">Expansion</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Motor BR */}
                        <div className="p-3 rounded-lg border border-border/50 bg-zinc-900/30 space-y-2">
                          <Label className="text-sm font-semibold">
                            {createFormData.templateType === 'tank-drive' ? 'Right Back Motor' : 'Back Right Motor'}
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-3 sm:col-span-1">
                              <Label htmlFor="motorBR-name" className="text-xs text-muted-foreground">Motor Name</Label>
                              <Input
                                id="motorBR-name"
                                placeholder={createFormData.templateType === 'tank-drive' ? "rightBack" : "backRight"}
                                value={createFormData.motors.motorBR.name}
                                onChange={(e) => setCreateFormData({
                                  ...createFormData,
                                  motors: {
                                    ...createFormData.motors,
                                    motorBR: { ...createFormData.motors.motorBR, name: e.target.value }
                                  }
                                })}
                                className="bg-background/50 mt-1 h-9"
                              />
                            </div>
                            <div>
                              <Label htmlFor="motorBR-port" className="text-xs text-muted-foreground">Port</Label>
                              <Select
                                value={createFormData.motors.motorBR.port.toString()}
                                onValueChange={(value) => setCreateFormData({
                                  ...createFormData,
                                  motors: {
                                    ...createFormData.motors,
                                    motorBR: { ...createFormData.motors.motorBR, port: parseInt(value) }
                                  }
                                })}
                              >
                                <SelectTrigger className="bg-background/50 mt-1 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">Port 0</SelectItem>
                                  <SelectItem value="1">Port 1</SelectItem>
                                  <SelectItem value="2">Port 2</SelectItem>
                                  <SelectItem value="3">Port 3</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="motorBR-hub" className="text-xs text-muted-foreground">Hub</Label>
                              <Select
                                value={createFormData.motors.motorBR.hub}
                                onValueChange={(value: "control" | "expansion") => setCreateFormData({
                                  ...createFormData,
                                  motors: {
                                    ...createFormData.motors,
                                    motorBR: { ...createFormData.motors.motorBR, hub: value }
                                  }
                                })}
                              >
                                <SelectTrigger className="bg-background/50 mt-1 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="control">Control</SelectItem>
                                  <SelectItem value="expansion">Expansion</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* H-Drive Center Motor */}
                        {createFormData.templateType === 'h-drive' && (
                          <div className="p-3 rounded-lg border border-orange-500/50 bg-orange-900/10 space-y-2">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                              Center Strafe Wheel
                              <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/20">
                                H-Drive Only
                              </Badge>
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-3 sm:col-span-1">
                                <Label htmlFor="motorCL-name" className="text-xs text-muted-foreground">Motor Name</Label>
                                <Input
                                  id="motorCL-name"
                                  placeholder="centerStrafe"
                                  value={createFormData.motors.motorCL.name}
                                  onChange={(e) => setCreateFormData({
                                    ...createFormData,
                                    motors: {
                                      ...createFormData.motors,
                                      motorCL: { ...createFormData.motors.motorCL, name: e.target.value }
                                    }
                                  })}
                                  className="bg-background/50 mt-1 h-9"
                                />
                              </div>
                              <div>
                                <Label htmlFor="motorCL-port" className="text-xs text-muted-foreground">Port</Label>
                                <Select
                                  value={createFormData.motors.motorCL.port.toString()}
                                  onValueChange={(value) => setCreateFormData({
                                    ...createFormData,
                                    motors: {
                                      ...createFormData.motors,
                                      motorCL: { ...createFormData.motors.motorCL, port: parseInt(value) }
                                    }
                                  })}
                                >
                                  <SelectTrigger className="bg-background/50 mt-1 h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">Port 0</SelectItem>
                                    <SelectItem value="1">Port 1</SelectItem>
                                    <SelectItem value="2">Port 2</SelectItem>
                                    <SelectItem value="3">Port 3</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="motorCL-hub" className="text-xs text-muted-foreground">Hub</Label>
                                <Select
                                  value={createFormData.motors.motorCL.hub}
                                  onValueChange={(value: "control" | "expansion") => setCreateFormData({
                                    ...createFormData,
                                    motors: {
                                      ...createFormData.motors,
                                      motorCL: { ...createFormData.motors.motorCL, hub: value }
                                    }
                                  })}
                                >
                                  <SelectTrigger className="bg-background/50 mt-1 h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="control">Control</SelectItem>
                                    <SelectItem value="expansion">Expansion</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    </div>
                  </div>
                )}

                <DialogFooter className="flex-shrink-0 mt-4">
                  {createStep === 'config' && (
                    <Button
                      variant="outline"
                      onClick={() => setCreateStep('drivetrain')}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false)
                      setCreateStep('drivetrain')
                    }}
                  >
                    Cancel
                  </Button>
                  {createStep === 'drivetrain' ? (
                    <Button onClick={() => setCreateStep('config')}>
                      Continue
                    </Button>
                  ) : (
                    <Button onClick={handleCreateProject} disabled={!createFormData.name}>
                      Create Project
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

          {/* Existing Projects */}
          {loading ? (
            <p className="text-muted-foreground col-span-full text-center py-12">Loading projects...</p>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all h-[240px] flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription>
                    {DRIVETRAIN_DEFINITIONS[project.template_type]?.name || project.template_type}
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
                    onClick={() => router.push(`/dashboard/${username}/${project.project_hash}`)}
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
