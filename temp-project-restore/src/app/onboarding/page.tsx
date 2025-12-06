'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type QuestionnaireData = {
  name: string
  texture: string
  density: string
  porosity: string
  chemicalHistory: string
  currentRoutine: string
  goals: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<QuestionnaireData>({
    name: '',
    texture: '',
    density: '',
    porosity: '',
    chemicalHistory: '',
    currentRoutine: '',
    goals: '',
  })

  const totalSteps = 4

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // Salvar dados e ir para análise de foto
      localStorage.setItem('questionnaireData', JSON.stringify(data))
      router.push('/analysis')
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.name.trim() !== ''
      case 2:
        return data.texture !== '' && data.density !== '' && data.porosity !== ''
      case 3:
        return data.chemicalHistory !== ''
      case 4:
        return data.goals.trim() !== ''
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Curlara
            </h1>
          </div>
          <p className="text-gray-600">Vamos conhecer seu cabelo melhor</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Passo {step} de {totalSteps}</span>
            <span className="text-sm text-gray-600">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Questions */}
        <Card className="p-8 bg-white shadow-xl">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Bem-vinda ao Curlara! 👋</h2>
                <p className="text-gray-600">Vamos começar com o básico.</p>
              </div>
              <div>
                <Label htmlFor="name" className="text-base">Como você gostaria de ser chamada?</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  placeholder="Seu nome"
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Sobre Seu Cabelo</h2>
                <p className="text-gray-600">Nos conte mais sobre as características dos seus fios.</p>
              </div>

              <div>
                <Label className="text-base mb-3 block">Qual a textura do seu cabelo?</Label>
                <RadioGroup value={data.texture} onValueChange={(value) => setData({ ...data, texture: value })}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                    <RadioGroupItem value="liso" id="liso" />
                    <Label htmlFor="liso" className="cursor-pointer flex-1">Liso (tipo 1)</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                    <RadioGroupItem value="ondulado" id="ondulado" />
                    <Label htmlFor="ondulado" className="cursor-pointer flex-1">Ondulado (tipo 2)</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                    <RadioGroupItem value="cacheado" id="cacheado" />
                    <Label htmlFor="cacheado" className="cursor-pointer flex-1">Cacheado (tipo 3)</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                    <RadioGroupItem value="crespo" id="crespo" />
                    <Label htmlFor="crespo" className="cursor-pointer flex-1">Crespo (tipo 4)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base mb-3 block">Densidade dos fios</Label>
                <RadioGroup value={data.density} onValueChange={(value) => setData({ ...data, density: value })}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-teal-50 transition-colors">
                    <RadioGroupItem value="baixa" id="densidade-baixa" />
                    <Label htmlFor="densidade-baixa" className="cursor-pointer flex-1">Baixa (fios finos e espaçados)</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-teal-50 transition-colors">
                    <RadioGroupItem value="media" id="densidade-media" />
                    <Label htmlFor="densidade-media" className="cursor-pointer flex-1">Média (volume moderado)</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-teal-50 transition-colors">
                    <RadioGroupItem value="alta" id="densidade-alta" />
                    <Label htmlFor="densidade-alta" className="cursor-pointer flex-1">Alta (muito volume e fios densos)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base mb-3 block">Porosidade do cabelo</Label>
                <RadioGroup value={data.porosity} onValueChange={(value) => setData({ ...data, porosity: value })}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-cyan-50 transition-colors">
                    <RadioGroupItem value="baixa" id="porosidade-baixa" />
                    <Label htmlFor="porosidade-baixa" className="cursor-pointer flex-1">Baixa (demora para absorver água)</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-cyan-50 transition-colors">
                    <RadioGroupItem value="media" id="porosidade-media" />
                    <Label htmlFor="porosidade-media" className="cursor-pointer flex-1">Média (absorve e retém bem)</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-cyan-50 transition-colors">
                    <RadioGroupItem value="alta" id="porosidade-alta" />
                    <Label htmlFor="porosidade-alta" className="cursor-pointer flex-1">Alta (absorve rápido, resseca fácil)</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Histórico Capilar</h2>
                <p className="text-gray-600">Isso nos ajuda a entender melhor a saúde dos seus fios.</p>
              </div>

              <div>
                <Label className="text-base mb-3 block">Você já fez alguma química no cabelo?</Label>
                <RadioGroup value={data.chemicalHistory} onValueChange={(value) => setData({ ...data, chemicalHistory: value })}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                    <RadioGroupItem value="nunca" id="nunca" />
                    <Label htmlFor="nunca" className="cursor-pointer flex-1">Nunca fiz química</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                    <RadioGroupItem value="coloracao" id="coloracao" />
                    <Label htmlFor="coloracao" className="cursor-pointer flex-1">Coloração/Descoloração</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                    <RadioGroupItem value="alisamento" id="alisamento" />
                    <Label htmlFor="alisamento" className="cursor-pointer flex-1">Alisamento/Relaxamento</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                    <RadioGroupItem value="multiplas" id="multiplas" />
                    <Label htmlFor="multiplas" className="cursor-pointer flex-1">Múltiplas químicas</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="routine" className="text-base">Qual sua rotina atual de cuidados?</Label>
                <Textarea
                  id="routine"
                  value={data.currentRoutine}
                  onChange={(e) => setData({ ...data, currentRoutine: e.target.value })}
                  placeholder="Ex: Lavo 2x por semana, uso máscara 1x por semana..."
                  className="mt-2 min-h-[100px]"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Seus Objetivos</h2>
                <p className="text-gray-600">O que você gostaria de alcançar com seus cachos?</p>
              </div>

              <div>
                <Label htmlFor="goals" className="text-base">Conte-nos seus objetivos</Label>
                <Textarea
                  id="goals"
                  value={data.goals}
                  onChange={(e) => setData({ ...data, goals: e.target.value })}
                  placeholder="Ex: Quero definir mais os cachos, reduzir o frizz, hidratar mais..."
                  className="mt-2 min-h-[150px]"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm text-emerald-800">
                  <strong>Próximo passo:</strong> Vamos analisar uma foto do seu cabelo para criar 
                  uma rotina personalizada perfeita para você! 📸
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {step === totalSteps ? 'Analisar Foto' : 'Próximo'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
