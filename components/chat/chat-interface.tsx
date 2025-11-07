"use client"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  LifeBuoy,
  CreditCard,
  Users,
  X,
  Phone,
  Video,
  MoreVertical,
} from "lucide-react"

// Types
type Status = "online" | "away" | "busy" | "offline"

interface SupportCategory {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  status: Status
  unreadCount: number
  description: string
}

// Support categories data
const supportCategories: SupportCategory[] = [
  {
    id: "technical",
    name: "Technical Support",
    icon: LifeBuoy,
    status: "online",
    unreadCount: 0,
    description: "Get help with technical issues and troubleshooting"
  },
  {
    id: "billing", 
    name: "Billing Support",
    icon: CreditCard,
    status: "online",
    unreadCount: 2,
    description: "Questions about invoices, payments, and billing"
  },
  {
    id: "customer-success",
    name: "Customer Success", 
    icon: Users,
    status: "away",
    unreadCount: 0,
    description: "Account management and feature guidance"
  }
]

export function ChatInterface() {
  const [activeCategory, setActiveCategory] = useState<SupportCategory | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [tawkLoaded, setTawkLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Filter categories based on search query
  const filteredCategories = supportCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Set first category as active by default
  useEffect(() => {
    if (filteredCategories.length > 0 && !activeCategory) {
      setActiveCategory(filteredCategories[0])
    }
  }, [filteredCategories, activeCategory])

  // Load Tawk.to script (improved hiding logic)
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Tawk_API) {
      (window as any).Tawk_API = (window as any).Tawk_API || {};
      (window as any).Tawk_LoadStart = new Date();

      const script = document.createElement("script")
      script.type = "text/javascript"
      script.async = true
      script.src = "https://embed.tawk.to/684fbe1757eabb190a26654c/1itrnt3nh?hide=true"
      script.charset = "UTF-8"
      script.setAttribute("crossorigin", "*")

      // Hide the widget as soon as possible, and override onLoad to always hide
      script.onload = () => {
        if ((window as any).Tawk_API) {
          (window as any).Tawk_API.onLoad = function () {
            (window as any).Tawk_API.hideWidget();
          };
        }
      };

      const firstScript = document.getElementsByTagName("script")[0]
      firstScript.parentNode?.insertBefore(script, firstScript)

      return () => {
        script.remove()
      }
    }
  }, [])

  // Get status color
  const getStatusColor = (status: Status) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      case "busy":
        return "bg-red-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get status text
  const getStatusText = (status: Status) => {
    switch (status) {
      case "online":
        return "Online"
      case "away":
        return "Away"
      case "busy":
        return "Busy"
      case "offline":
        return "Offline"
      default:
        return "Offline"
    }
  }

  // Handle category selection
  const handleCategorySelect = (category: SupportCategory) => {
    setActiveCategory(category)
    
    // You can customize Tawk.to based on the selected category
    if ((window as any).Tawk_API) {
      // Set custom attributes based on the selected category
      (window as any).Tawk_API.setAttributes({
        'department': category.id,
        'category': category.name
      }, function(error: any) {
        if (error) {
          console.error('Error setting Tawk.to attributes:', error)
        }
      })
    }
  }

  return (
    <div className="flex h-full flex-col space-y-4 p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Support Center</h1>
        </div>
      </div>

      <div className="flex h-[calc(100vh-180px)] gap-4">
        {/* Support Categories Sidebar */}
        <div className="flex w-[280px] flex-col space-y-4 border-r border-gray-200 pr-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search support categories..."
              className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-1 top-1 h-7 w-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2 pr-3">
              {filteredCategories.map((category) => {
                const IconComponent = category.icon
                return (
                  <div
                    key={category.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors ${
                      activeCategory?.id === category.id
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                    onClick={() => handleCategorySelect(category)}
                  >
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(
                          category.status
                        )}`}
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-gray-900">{category.name}</p>
                        {category.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center h-5 px-2 text-xs font-medium text-white bg-red-500 rounded-full">
                            {category.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {category.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getStatusText(category.status)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 text-center">
              Select a category to start chatting with our support team
            </p>
          </div>
        </div>

        {/* Chat Area with Tawk.to Integration */}
        {activeCategory ? (
          <div className="flex flex-1 flex-col">
            {/* Tawk.to chat widget will appear automatically after script loads */}
            <iframe
              src="https://tawk.to/chat/684fbe1757eabb190a26654c/1itrnt3nh"
              className="w-full h-full border-0 rounded-lg shadow-sm"
              title={activeCategory?.name || "Support Chat"}
              allow="microphone; camera"
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <LifeBuoy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-900">
                Welcome to Support
              </h3>
              <p className="text-gray-600">
                Choose a support category to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
