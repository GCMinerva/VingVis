import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Settings2 } from "lucide-react"

type Motor = {
  id: string
  name: string
  port: number
  direction: 'FORWARD' | 'REVERSE'
  type: 'DC_MOTOR' | 'ENCODED_MOTOR'
}

type Servo = {
  id: string
  name: string
  port: number
  minPosition: number
  maxPosition: number
}

type I2CDevice = {
  id: string
  name: string
  type: 'IMU' | 'COLOR_SENSOR' | 'DISTANCE_SENSOR' | 'CUSTOM'
  address: string
}

type HardwareConfig = {
  motors: Motor[]
  servos: Servo[]
  i2cDevices: I2CDevice[]
}

interface HardwareConfigPanelProps {
  config: HardwareConfig
  onChange: (config: HardwareConfig) => void
}

export function HardwareConfigPanel({ config, onChange }: HardwareConfigPanelProps) {
  const [activeTab, setActiveTab] = useState('motors')

  const addMotor = () => {
    const newMotor: Motor = {
      id: Date.now().toString(),
      name: `motor${config.motors.length + 1}`,
      port: config.motors.length,
      direction: 'FORWARD',
      type: 'DC_MOTOR'
    }
    onChange({ ...config, motors: [...config.motors, newMotor] })
  }

  const updateMotor = (id: string, updates: Partial<Motor>) => {
    onChange({
      ...config,
      motors: config.motors.map(m => m.id === id ? { ...m, ...updates } : m)
    })
  }

  const deleteMotor = (id: string) => {
    onChange({
      ...config,
      motors: config.motors.filter(m => m.id !== id)
    })
  }

  const addServo = () => {
    const newServo: Servo = {
      id: Date.now().toString(),
      name: `servo${config.servos.length + 1}`,
      port: config.servos.length,
      minPosition: 0,
      maxPosition: 1
    }
    onChange({ ...config, servos: [...config.servos, newServo] })
  }

  const updateServo = (id: string, updates: Partial<Servo>) => {
    onChange({
      ...config,
      servos: config.servos.map(s => s.id === id ? { ...s, ...updates } : s)
    })
  }

  const deleteServo = (id: string) => {
    onChange({
      ...config,
      servos: config.servos.filter(s => s.id !== id)
    })
  }

  const addI2CDevice = () => {
    const newDevice: I2CDevice = {
      id: Date.now().toString(),
      name: `device${config.i2cDevices.length + 1}`,
      type: 'IMU',
      address: '0x68'
    }
    onChange({ ...config, i2cDevices: [...config.i2cDevices, newDevice] })
  }

  const updateI2CDevice = (id: string, updates: Partial<I2CDevice>) => {
    onChange({
      ...config,
      i2cDevices: config.i2cDevices.map(d => d.id === id ? { ...d, ...updates } : d)
    })
  }

  const deleteI2CDevice = (id: string) => {
    onChange({
      ...config,
      i2cDevices: config.i2cDevices.filter(d => d.id !== id)
    })
  }

  return (
    <Card className="h-full border-border/50 bg-background/95">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-blue-400" />
          <CardTitle className="text-lg">Hardware Configuration</CardTitle>
        </div>
        <CardDescription>Configure your robot's hardware</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="motors">Motors ({config.motors.length})</TabsTrigger>
            <TabsTrigger value="servos">Servos ({config.servos.length})</TabsTrigger>
            <TabsTrigger value="i2c">I2C ({config.i2cDevices.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="motors" className="space-y-3 mt-4">
            <Button onClick={addMotor} size="sm" className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Motor
            </Button>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {config.motors.map((motor) => (
                <Card key={motor.id} className="p-3 bg-background/50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">Motor</Label>
                      <Button
                        onClick={() => deleteMotor(motor.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={motor.name}
                        onChange={(e) => updateMotor(motor.id, { name: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Port</Label>
                        <Input
                          type="number"
                          value={motor.port}
                          onChange={(e) => updateMotor(motor.id, { port: parseInt(e.target.value) })}
                          className="h-8 text-xs"
                          min={0}
                          max={3}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Direction</Label>
                        <Select
                          value={motor.direction}
                          onValueChange={(value: 'FORWARD' | 'REVERSE') => updateMotor(motor.id, { direction: value })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FORWARD">Forward</SelectItem>
                            <SelectItem value="REVERSE">Reverse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="servos" className="space-y-3 mt-4">
            <Button onClick={addServo} size="sm" className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Servo
            </Button>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {config.servos.map((servo) => (
                <Card key={servo.id} className="p-3 bg-background/50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">Servo</Label>
                      <Button
                        onClick={() => deleteServo(servo.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={servo.name}
                        onChange={(e) => updateServo(servo.id, { name: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Port</Label>
                      <Input
                        type="number"
                        value={servo.port}
                        onChange={(e) => updateServo(servo.id, { port: parseInt(e.target.value) })}
                        className="h-8 text-xs"
                        min={0}
                        max={5}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Min Pos</Label>
                        <Input
                          type="number"
                          value={servo.minPosition}
                          onChange={(e) => updateServo(servo.id, { minPosition: parseFloat(e.target.value) })}
                          className="h-8 text-xs"
                          step={0.1}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Pos</Label>
                        <Input
                          type="number"
                          value={servo.maxPosition}
                          onChange={(e) => updateServo(servo.id, { maxPosition: parseFloat(e.target.value) })}
                          className="h-8 text-xs"
                          step={0.1}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="i2c" className="space-y-3 mt-4">
            <Button onClick={addI2CDevice} size="sm" className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add I2C Device
            </Button>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {config.i2cDevices.map((device) => (
                <Card key={device.id} className="p-3 bg-background/50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">I2C Device</Label>
                      <Button
                        onClick={() => deleteI2CDevice(device.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={device.name}
                        onChange={(e) => updateI2CDevice(device.id, { name: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={device.type}
                        onValueChange={(value: I2CDevice['type']) => updateI2CDevice(device.id, { type: value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IMU">IMU</SelectItem>
                          <SelectItem value="COLOR_SENSOR">Color Sensor</SelectItem>
                          <SelectItem value="DISTANCE_SENSOR">Distance Sensor</SelectItem>
                          <SelectItem value="CUSTOM">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">I2C Address</Label>
                      <Input
                        value={device.address}
                        onChange={(e) => updateI2CDevice(device.id, { address: e.target.value })}
                        className="h-8 text-xs"
                        placeholder="0x68"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export type { HardwareConfig, Motor, Servo, I2CDevice }
