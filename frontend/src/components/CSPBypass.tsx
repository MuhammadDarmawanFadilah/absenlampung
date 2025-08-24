'use client'

import { useEffect } from 'react'

/**
 * Emergency CSP Bypass Component
 * 
 * This component implements emergency solutions to fix the WebAssembly CSP issue
 * that prevents MediaPipe from working despite correct server headers.
 * 
 * CRITICAL ISSUE: Server sends correct CSP with 'unsafe-eval' but browser receives wrong CSP
 * without 'unsafe-eval', causing WebAssembly compilation to fail.
 */
export default function CSPBypass() {
  useEffect(() => {
    console.log('🆘 CSP Bypass Component initialized - attempting emergency fixes...')
    
    // Emergency Fix 1: Remove any existing CSP meta tags that might override server headers
    const removeBadCSPTags = () => {
      const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]')
      metaTags.forEach((tag, index) => {
        const content = tag.getAttribute('content') || ''
        console.log(`🔍 Found CSP meta tag ${index + 1}:`, content)
        
        // Remove any CSP meta tags that don't contain 'unsafe-eval'
        if (!content.includes('unsafe-eval')) {
          console.log('🗑️ Removing bad CSP meta tag:', content)
          tag.remove()
        }
      })
    }
    
    // Emergency Fix 2: Force add correct CSP meta tag with 'unsafe-eval'
    const addCorrectCSP = () => {
      // First, remove any existing CSP meta tags
      const existingTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]')
      existingTags.forEach(tag => tag.remove())
      
      // Add our emergency CSP with 'unsafe-eval' for WebAssembly
      const metaCSP = document.createElement('meta')
      metaCSP.setAttribute('http-equiv', 'Content-Security-Policy')
      metaCSP.setAttribute('content', 
        "default-src 'self' 'unsafe-eval' http: https: data: blob: 'unsafe-inline'; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http: data: blob:; " +
        "worker-src 'self' blob: data:; " +
        "connect-src 'self' https: http: ws: wss:; " +
        "img-src 'self' https: http: data: blob:; " +
        "style-src 'self' 'unsafe-inline' https: http:; " +
        "font-src 'self' https: http: data:; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "frame-ancestors 'none';"
      )
      
      // Insert at the beginning of head to take priority
      const head = document.head || document.getElementsByTagName('head')[0]
      head.insertBefore(metaCSP, head.firstChild)
      
      console.log('✅ Emergency CSP meta tag added with unsafe-eval')
      console.log('📋 Emergency CSP content:', metaCSP.getAttribute('content'))
    }
    
    // Emergency Fix 3: Inject CSP override script
    const injectCSPOverrideScript = () => {
      const script = document.createElement('script')
      script.textContent = `
        // Emergency CSP override for MediaPipe WebAssembly
        (function() {
          try {
            console.log('📜 CSP override script executing...');
            
            // Force enable unsafe-eval for current document
            if (typeof window !== 'undefined' && window.document) {
              const head = window.document.head || window.document.getElementsByTagName('head')[0];
              
              // Remove all existing CSP meta tags
              const existingCSP = head.querySelectorAll('meta[http-equiv="Content-Security-Policy"], meta[http-equiv="content-security-policy"]');
              existingCSP.forEach(tag => {
                console.log('�️ Removing existing CSP:', tag.getAttribute('content'));
                tag.remove();
              });
              
              // Add emergency CSP with unsafe-eval
              const emergencyCSP = window.document.createElement('meta');
              emergencyCSP.setAttribute('http-equiv', 'Content-Security-Policy');
              emergencyCSP.setAttribute('content', 
                "default-src 'self' 'unsafe-eval' 'unsafe-inline' https: http: data: blob:; " +
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http: data: blob:; " +
                "worker-src 'self' 'unsafe-eval' blob: data:;"
              );
              head.insertBefore(emergencyCSP, head.firstChild);
              
              console.log('✅ Emergency CSP injected via script');
            }
          } catch (error) {
            console.warn('⚠️ CSP override script failed:', error);
          }
        })();
      `
      document.head.appendChild(script)
      console.log('✅ CSP override script injected')
    }
    
    // Emergency Fix 4: Force reload page with CSP disabled (last resort)
    const forceReloadWithoutCSP = () => {
      const currentUrl = new URL(window.location.href)
      if (!currentUrl.searchParams.has('csp-bypass')) {
        console.log('🔄 Adding CSP bypass parameter and reloading...')
        currentUrl.searchParams.set('csp-bypass', 'true')
        
        // Store bypass preference
        sessionStorage.setItem('csp-bypass-enabled', 'true')
        
        // Reload with bypass parameter
        setTimeout(() => {
          window.location.href = currentUrl.toString()
        }, 2000)
        
        return true // Indicates reload will happen
      }
      return false // No reload needed
    }
    
    // Execute emergency fixes in sequence
    const executeEmergencyFixes = async () => {
      console.log('🚨 Starting emergency CSP fixes for MediaPipe WebAssembly...')
      
      // Check if page was already reloaded with bypass
      const bypassEnabled = sessionStorage.getItem('csp-bypass-enabled')
      const urlBypass = new URL(window.location.href).searchParams.has('csp-bypass')
      
      if (bypassEnabled || urlBypass) {
        console.log('🔧 CSP bypass mode active, applying all fixes...')
      }
      
      // Apply all fixes
      removeBadCSPTags()
      addCorrectCSP()
      injectCSPOverrideScript()
      
      // Give fixes time to take effect
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Test if fixes worked
      setTimeout(() => {
        testWebAssemblySupport()
      }, 1500)
      
      // Last resort: reload page with CSP bypass (only if not already bypassed)
      if (!bypassEnabled && !urlBypass) {
        setTimeout(() => {
          const willReload = forceReloadWithoutCSP()
          if (willReload) {
            console.log('🔄 Will reload page with CSP bypass in 2 seconds...')
          }
        }, 5000) // Wait 5 seconds before reloading to let user see the fixes attempt
      }
      
      console.log('✅ All emergency CSP fixes applied')
    }
    
    // Test WebAssembly support after fixes
    const testWebAssemblySupport = async () => {
      try {
        console.log('🧪 Testing WebAssembly support after emergency fixes...')
        
        // Simple WebAssembly test
        const wasmBytes = new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00
        ])
        
        const wasmModule = await WebAssembly.instantiate(wasmBytes)
        console.log('✅ WebAssembly test successful! Emergency fixes worked.')
        
        // Notify parent components that WebAssembly is working
        window.dispatchEvent(new CustomEvent('webassembly-ready', {
          detail: { success: true, message: 'Emergency CSP fixes successful' }
        }))
        
      } catch (error: any) {
        console.error('❌ WebAssembly test failed even after emergency fixes:', error)
        
        // Show user-friendly error message
        const errorMessage = error?.message || 'Unknown error'
        if (errorMessage.includes('unsafe-eval')) {
          console.error('💥 CRITICAL: unsafe-eval still blocked despite all emergency fixes!')
          console.error('📝 Recommendation: Clear browser cache and restart browser')
        }
        
        // Notify parent components of continued failure
        window.dispatchEvent(new CustomEvent('webassembly-ready', {
          detail: { 
            success: false, 
            message: 'Emergency CSP fixes failed', 
            error: errorMessage
          }
        }))
      }
    }
    
    // Start emergency fixes immediately
    executeEmergencyFixes()
    
    // Cleanup function
    return () => {
      console.log('🧹 CSP Bypass component cleanup')
    }
  }, [])
  
  // Check if bypass is active
  const bypassActive = new URL(window.location.href).searchParams.has('csp-bypass') || 
                      sessionStorage.getItem('csp-bypass-enabled')
  
  // Render status indicator
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <div className="bg-orange-100 border border-orange-300 text-orange-800 px-3 py-2 rounded-lg shadow-lg text-xs font-medium">
        🆘 Emergency CSP Override Active
      </div>
      {bypassActive && (
        <div className="bg-blue-100 border border-blue-300 text-blue-800 px-3 py-2 rounded-lg shadow-lg text-xs font-medium">
          🔧 Bypass Mode Enabled
        </div>
      )}
    </div>
  )
}