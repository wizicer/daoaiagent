"use client"

import { useState, useRef, useEffect } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SHA256 } from 'crypto-js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import AIAConfigPanel from "./aia-config-panel"
import ProcessConfig, { type ProcessConfigs } from "./process-config"
import { daoFactoryABI, daoFactoryAddress } from "@/contracts/dao-factory"
import { useDAOStore } from "@/lib/store/dao"
import type { AIA as StoreAIA } from "@/lib/store/dao"

interface AIAConfig {
  id: string
  role: string
  emoji: string
  permissions: string[]
  weight: number
  type: "Internal" | "Public"
  prompts: string[]
  nexts: string[]
}

export default function ManifestoForm() {
  const router = useRouter()
  const { data: hash, writeContract, isPending, isError, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash, })
  const addDAO = useDAOStore(state => state.addDAO)
  const daos = useDAOStore(state => state.daos)
  const [formData, setFormData] = useState({
    name: "My DAO",
    description: "A decentralized organization powered by AI agents",
    logo: "🤖", 
    tokenContractAddress: "0xDfbEE02da49CB97E75A8AaD35620FE602F38fb19",
    objective: `Our mission is to revolutionize decentralized governance through the seamless integration of AI agents and human collaboration. We aim to achieve this through the following SMART objectives:

1. Specific: Develop and deploy a network of specialized AI agents that serve distinct roles within the DAO ecosystem, each contributing their unique capabilities to enhance decision-making and operational efficiency.

2. Measurable: 
   - Achieve a 90% consensus rate in proposal voting through AI-assisted deliberation by Q4 2025
   - Onboard 1000 active members and deploy 50 specialized AI agents across various roles by Q2 2025
   - Reduce average proposal processing time by 60% through AI-driven automation by Q3 2025

3. Achievable: Leverage cutting-edge language models and decision-making frameworks to create AI agents that can effectively:
   - Analyze and summarize proposals
   - Facilitate discussions between stakeholders
   - Provide data-driven insights for decision-making
   - Monitor and report on proposal implementation

4. Relevant: Address the core challenges in DAO governance by:
   - Enhancing proposal quality through AI-assisted refinement
   - Improving participation rates through engaging AI-driven interactions
   - Ensuring transparent and accountable decision-making processes
   - Fostering a collaborative environment between human members and AI agents

5. Time-bound: Establish a fully operational AI-enhanced DAO governance system by Q4 2025, with quarterly milestones for feature deployment and performance optimization.`,
    values: `Our DAO is built upon a foundation of core values that guide every aspect of our operations and decision-making:

1. Transparency:
   - Maintain an immutable record of all decisions and their rationale
   - Ensure all AI agent actions are traceable and auditable
   - Provide clear documentation of governance processes and system architecture
   - Regular reporting on DAO performance and milestone achievements

2. Innovation:
   - Continuously explore and integrate emerging AI technologies
   - Encourage experimental governance models that combine human and AI capabilities
   - Foster a culture of creative problem-solving and iterative improvement
   - Support research and development in AI governance mechanisms

3. Collaboration:
   - Create synergistic relationships between human members and AI agents
   - Facilitate knowledge sharing across different expertise domains
   - Promote inclusive decision-making that considers diverse perspectives
   - Build bridges between traditional organizations and Web3 communities

4. Decentralization:
   - Distribute power and responsibility across the network
   - Prevent concentration of control through algorithmic checks and balances
   - Enable permissionless participation while maintaining system integrity
   - Support autonomous operation through smart contracts and AI automation

5. Ethical AI Development:
   - Prioritize responsible AI deployment with human oversight
   - Ensure AI decisions align with community values and interests
   - Maintain transparency in AI training and decision-making processes
   - Regular ethical audits of AI agent behaviors and impacts`,
    allowIndependentAIA: true
  })

  const [agents, setAgents] = useState<AIAConfig[]>([])
  const [processes, setProcesses] = useState<ProcessConfigs>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const contentHash = SHA256(JSON.stringify({
        name: formData.name,
        description: formData.description,
        logo: formData.logo,
        objective: formData.objective,
        values: formData.values,
        agents,
        processes
      })).toString()

      await writeContract({
        abi: daoFactoryABI,
        address: daoFactoryAddress,
        functionName: 'createDAO',
        args: [formData.tokenContractAddress, formData.allowIndependentAIA, "0x"+contentHash]
      })
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create DAO")
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isConfirming && hash) {
      const newDAO = {
        id: daos.length + 1,
        name: formData.name,
        description: formData.description,
        logo: formData.logo,
        treasury: formData.tokenContractAddress,
        members: 1,
        activeProposals: 0,
        objective: formData.objective,
        values: formData.values,
        aias: agents.map(agent => ({
          id: agent.id,
          name: agent.role,
          avatar: agent.emoji,
          type: agent.type,
          status: 'Active'
        } as StoreAIA)),
        processes: {
          proposal: { enabled: true, params: {} },
          treasury: { enabled: true, params: {} },
          membership: { enabled: true, params: {} }
        }
      }
      
      addDAO(newDAO)
      router.push('/daos/' + newDAO.id)
    }
  }, [isConfirming, hash])

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Basic Information</h2>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            DAO Name
          </label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="logo" className="block text-sm font-medium mb-1">
            Logo (Emoji)
          </label>
          <Input
            id="logo"
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            placeholder="Enter an emoji (e.g., 🌟)"
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full min-h-[100px]"
          />
        </div>

        <div>
          <label htmlFor="tokenContractAddress" className="block text-sm font-medium mb-1">
            Token Contract Address
          </label>
          <Input
            id="tokenContractAddress"
            value={formData.tokenContractAddress}
            onChange={(e) => setFormData({ ...formData, tokenContractAddress: e.target.value })}
            className="w-full"
            placeholder="0x..."
          />
        </div>
      </div>

      {/* Manifesto Content */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Manifesto Content</h2>
        
        <div>
          <label htmlFor="objective" className="block text-sm font-medium mb-1">
            Organization Objective
          </label>
          <Textarea
            id="objective"
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            rows={4}
            required
          />
        </div>

        <div>
          <label htmlFor="values" className="block text-sm font-medium mb-1">
            Values Statement
          </label>
          <Textarea
            id="values"
            value={formData.values}
            onChange={(e) => setFormData({ ...formData, values: e.target.value })}
            rows={4}
            required
          />
        </div>
      </div>

      {/* AIA Settings */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">AIA Settings</h2>
        <div className="flex items-center space-x-4">
          <Switch
            id="allowIndependentAIA"
            checked={formData.allowIndependentAIA}
            onCheckedChange={(checked) => setFormData({ ...formData, allowIndependentAIA: checked })}
          />
          <div className="space-y-1">
            <Label htmlFor="allowIndependentAIA">Allow Independent AIA</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, meeting phase 2 will be enabled and all independent AIAs will be able to participate in voting.
            </p>
          </div>
        </div>
      </div>

      {/* AIA Configuration */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">AIA Configuration</h2>
        <AIAConfigPanel onDiagramChange={({ agents }) => setAgents(agents)} />
      </div>

      {/* Process Configuration */}
      {false && <div className="space-y-4">
        <h2 className="text-2xl font-bold">Process Configuration</h2>
        <ProcessConfig onChange={setProcesses} />
      </div>}

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" disabled={isSubmitting || isPending}>
          Save Draft
        </Button>
        <Button type="submit" disabled={isSubmitting || isPending}>
          {isSubmitting || isPending ? "Creating DAO..." : "Submit Manifesto"}
        </Button>
      </div>

      {(isError || errorMessage) && (
        <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          <p className="text-sm font-medium">Failed to create DAO</p>
          {error && (
            <p className="text-sm mt-1 font-mono break-all">
              {error.message || error.toString()}
            </p>
          )}
          {errorMessage && (
            <p className="text-sm mt-1 font-mono break-all">
              {errorMessage}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {hash && <div className="bg-primary/10 p-4 rounded-lg">Transaction Hash: {hash}</div>}
        {isConfirming && <div className="bg-info/10 p-4 rounded-lg">Waiting for confirmation...</div>}
        {isConfirmed && <div className="bg-success/10 p-4 rounded-lg">Transaction confirmed.</div>}
      </div>
    </form>
  )
}
