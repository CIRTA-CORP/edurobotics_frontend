/**
 * Token Section Component
 * 
 * Collapsible section for managing the admin authentication token.
 * Allows admins to input and save their authorization token.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/card'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'
import { Key, Save, ChevronDown, ChevronUp } from 'lucide-react'

export function TokenSection({ 
  adminToken, 
  onTokenChange, 
  onTokenSave, 
  expanded, 
  onToggle 
}) {
  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Admin Token
          </CardTitle>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          <Input
            type="password"
            value={adminToken}
            onChange={(e) => onTokenChange(e.target.value)}
            placeholder="Ingresa el token admin"
          />
          <Button onClick={onTokenSave}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Token
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
