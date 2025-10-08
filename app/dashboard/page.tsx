"use client"

import { useState } from "react"
import { Plus, Folder, ChevronRight, PanelLeftClose, PanelLeft, Bot } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { geist } from "@/lib/fonts"
import Playground from "@/components/dashboard/playground"

type Project = {
  id: string
  name: string
  createdAt: Date
  lastModified: Date
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      createdAt: new Date(),
      lastModified: new Date(),
    }

    setProjects([newProject, ...projects])
    setSelectedProject(newProject)
    setNewProjectName("")
    setShowNewProjectDialog(false)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black">
      {/* Sidebar Toggle Button (when closed) */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-lg border border-white/10 bg-black/90 px-3 py-2 text-sm text-white backdrop-blur transition-colors hover:bg-white/10"
          >
            <PanelLeft className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ x: -288, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -288, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex w-72 flex-col border-r border-white/10 bg-gradient-to-b from-zinc-950 to-black"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h1 className={cn("text-2xl font-bold text-white", geist.className)}>VingVis</h1>
                <p className="mt-1 text-sm text-zinc-400">FTC Playground</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* New Project Button */}
            <div className="p-4">
              <button
                onClick={() => setShowNewProjectDialog(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-gradient-to-br from-[#e78a53] to-[#f0a36f] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#e78a53]/20 transition-all hover:shadow-[#e78a53]/30"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            </div>

            {/* Projects List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Projects</div>
              {projects.length === 0 ? (
                <div className="mt-8 text-center text-sm text-zinc-600">
                  <Folder className="mx-auto mb-2 h-8 w-8" />
                  No projects yet
                </div>
              ) : (
                <div className="space-y-1">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        selectedProject?.id === project.id
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        <span className="truncate">{project.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-4">
              <div className="text-xs text-zinc-500">
                <p>Season 2025-2026</p>
                <p className="mt-1">Decode℠</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {selectedProject ? (
          <Playground project={selectedProject} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Bot className="mx-auto mb-4 h-16 w-16 text-[#e78a53]" />
                <h2 className={cn("text-3xl font-bold text-white", geist.className)}>
                  Welcome to VingVis Playground
                </h2>
                <p className="mt-2 text-zinc-400">Create a new project to get started</p>
                <button
                  onClick={() => setShowNewProjectDialog(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* New Project Dialog */}
      <AnimatePresence>
        {showNewProjectDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowNewProjectDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-6 shadow-2xl"
            >
              <h3 className={cn("text-xl font-semibold text-white", geist.className)}>Create New Project</h3>
              <p className="mt-2 text-sm text-zinc-400">Give your FTC autonomous project a name</p>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                placeholder="My Awesome Project"
                className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-[#e78a53] focus:ring-2 focus:ring-[#e78a53]/20"
                autoFocus
              />
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowNewProjectDialog(false)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="flex-1 rounded-lg bg-gradient-to-br from-[#e78a53] to-[#f0a36f] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#e78a53]/20 transition-all hover:shadow-[#e78a53]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Project
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
