"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  FileText,
  ShoppingCart,
  Users,
  Coins,
  Download,
  Bell,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  HomeIcon,
  Warehouse,
  ClipboardCheck,
  Truck,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  HelpCircle,
  Sparkles,
  LogOut,
  Tags,
  Palette,
  List,
  Icon,
  BookImage,
} from "lucide-react"
import { useQueryClient } from '@tanstack/react-query'
import { redirectToLogin } from '@/lib/services/auth-redirect'
import { useUserType } from "@/hooks/use-user-type"

interface ModernSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isSliderOpen?: boolean
}

export function ModernSidebar({ activeTab, onTabChange, isCollapsed = false, onToggleCollapse, isSliderOpen = false }: ModernSidebarProps) {
  const [userName, setUserName] = useState("")
  const [isPartnerManagementOpen, setIsPartnerManagementOpen] = useState(false)
  const [isAssetManagementOpen, setIsAssetManagementOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { userType } = useUserType()

  useEffect(() => {
    // Get user name from localStorage with key 'name'
    const storedName = localStorage.getItem("name") || ""
    setUserName(storedName)
    
    // Auto-expand Partner Management if all-supplier-details or accounting is active (for admin)
    if (userType === "admin" && (activeTab === "all-supplier-details" || activeTab === "payouts-and-reports")) {
      setIsPartnerManagementOpen(true)
    }

    // Auto-expand Asset Management if any asset tab is active (admin only)
    if (userType === "admin") {
      const assetIds = ["brand-management", "categories-management", "color-management"]
      if (assetIds.includes(activeTab)) {
        setIsAssetManagementOpen(true)
      }
    }
  }, [activeTab, userType])

  const handleLogout = () => {
    // Use centralized redirect utility which handles:
    // - Clearing auth storage
    // - Clearing all query cache (prevents data leakage)
    // - Notifying other tabs
    // - Redirecting to login
    redirectToLogin({
      router,
      queryClient,
      invalidateQueries: true,
      clearStorage: true,
      notifyTabs: true,
    })
  }

  // Base primary menu items
  const basePrimaryMenuItems = [
    { id: "home", label: "Home", icon: HomeIcon, isActive: true },
    { id: "order-history", label: "Order History", icon: FileText },
    { id: "quality-control", label: "Quality Control", icon: ClipboardCheck },
    { id: "inventory", label: "Inventory", icon: Warehouse },
    { id: "shipping-delivery", label: "Shipping & Delivery", icon: Truck },
  ]

  // Add accounting to primary menu for sellers only
  const primaryMenuItems = userType === "seller" 
    ? [...basePrimaryMenuItems, { id: "payouts-and-reports", label: "Payouts & Reports", icon: Coins }]
    : basePrimaryMenuItems
  
  // Partner Management items - only for admin
  const partnerManagementItems = [
    { id: "all-supplier-details", label: "All Supplier Details", icon: AlertTriangle },
    { id: "payouts-and-reports", label: "Payouts & Reports", icon: Coins },
  ]

  const assetManagementItems = [
    { id: "brand-management", label: "Brand Management", icon: Tags },
    { id: "categories-management", label: "Categories Management", icon: List },
    { id: "color-management", label: "Material library", icon: Palette  },
    { id: "shop-the-look", label: "Shop the look", icon: BookImage }
  ]
  

  const userActionItems = [
    { id: "notifications", label: "Notifications", icon: Bell },
    // { id: "profile", label: "Profile", icon: User },
    { id: "ask-kuberha-ai", label: "Casa CarigarAI", icon: Sparkles },
    // { id: "settings", label: "Settings", icon: Settings },
    // { id: "support", label: "Support", icon: HelpCircle },
    { id: "logout", label: "Logout", icon: LogOut },
  ]

  return (
    <div className="relative">
      {/* Collapse Button - Positioned on right border, outside sidebar to avoid overflow clipping */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="group fixed top-4 w-8 h-8 rounded-full border-2 border-primary-900 bg-white hover:bg-primary-900 hover:border-white flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-md z-[51]"
          style={{
            left: isCollapsed ? '102px' : '280px',
            transform: 'translateX(-50%)',
          }}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4 text-primary-800 group-hover:text-white transition-colors duration-200" /> : <ChevronLeft className="h-4 w-4 text-primary-800 group-hover:text-white transition-colors duration-200" />}
        </button>
      )}
      
      <div
        className={`fixed left-0 top-0 bg-[#33150B] border-natural-200 text-gray-900 transition-all duration-300 z-50 overflow-hidden ${
          isCollapsed ? "w-[102px] h-[calc(100vh-0rem)]" : "w-[280px] h-[calc(100vh-0rem)]"
        } ${isSliderOpen ? "overflow-y-hidden blur-sm opacity-75" : ""} flex flex-col`}
      >
      {/* Header */}
      <div className="p-2 h-20 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-center">
          {!isCollapsed && (
              <div className="flex flex-col items-center space-y-1 w-full">
                <div className="overflow-hidden flex-shrink-0 w-full max-w-[200px]">
                <Image
                    src="/images/Logo_Casa Carigar_ALABASTER 2.png"
                  alt="Casa Carigar Logo"
                    width={400}
                    height={80}
                    className="w-full h-auto object-contain"
                  />
                </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-12 h-12 rounded-lg overflow-hidden mx-auto flex-shrink-0">
              <Image
                src="/images/logo_casa.png"
                alt="Casa Carigar Logo"
                width={50}
                height={50}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <div className="flex-1 pt-4 overflow-y-auto scrollbar-hide scroll-smooth min-h-0">
        {/* Primary Navigation Section */}
        <div className={`${isCollapsed ? "px-2" : "px-4"} mb-6`}>
          <nav className="space-y-1">
            {primaryMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`${
                    isCollapsed ? "w-10 h-10 mx-auto" : "w-full h-10"
                  } ${
                    isActive
                      ? isCollapsed 
                        ? "bg-primary-800 text-white rounded-full hover:bg-primary-900 hover:text-white justify-center fornt-urbanist font-medium"
                        : "bg-primary-800 text-white rounded-lg hover:bg-primary-900 hover:text-white font-urbanist font-medium"
                      : isCollapsed
                        ? "text-white hover:bg-primary-900 hover:text-white justify-center font-urbanist font-medium"
                        : "text-white hover:bg-primary-900 hover:text-white font-urbanist font-medium"
                  } ${isCollapsed ? "px-0" : "px-3 justify-start text-left"} flex items-center`}
                  onClick={() => onTabChange(item.id)}
                >
                  <div className={`flex items-center w-full ${isCollapsed ? "justify-center" : ""}`}>
                    <Icon className={`${isCollapsed ? "h-4 w-4" : "h-6 w-6 mr-3"} flex-shrink-0`} />
                    {!isCollapsed && (
                      <span className="flex-1">{item.label}</span>
                    )}
                  </div>
                </Button>
              )
            })}
            
            {/* Partner Management Section - Only for Admin */}
            {userType === "admin" && !isCollapsed && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  className={`w-full h-10 px-3 justify-start text-left flex items-center ${
                    isPartnerManagementOpen || activeTab === "all-supplier-details"
                      ? "bg-primary-800 text-white rounded-lg hover:bg-primary-900 hover:text-white font-urbanist font-medium"
                      : "text-white hover:bg-primary-900 hover:text-white font-urbanist font-medium"
                  }`}
                  onClick={() => setIsPartnerManagementOpen(!isPartnerManagementOpen)}
                >
                  <Users className="h-6 w-6 mr-3 flex-shrink-0" />
                  <span className="flex-1">Partner Management</span>
                  {isPartnerManagementOpen ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  )}
                </Button>
                
                {isPartnerManagementOpen && (
                  <div className="mt-1 ml-4 space-y-1 border-l-2 border-primary-700 pl-3">
                    {partnerManagementItems.map((item) => {
                      const Icon = item.icon
                      const isActive = activeTab === item.id
                      
                      return (
                        <Button
                          key={item.id}
                          variant="ghost"
                          className={`w-full h-10 px-3 justify-start text-left flex items-center ${
                            isActive
                              ? "bg-primary-800 text-white rounded-lg hover:bg-primary-900 hover:text-white font-urbanist font-medium"
                              : "text-white hover:bg-primary-900 hover:text-white font-urbanist font-medium"
                          }`}
                          onClick={() => onTabChange(item.id)}
                        >
                          <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                          <span className="flex-1 text-sm">{item.label}</span>
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Asset Management Section - Only for Admin */}
            {userType === "admin" && !isCollapsed && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  className={`w-full h-10 px-3 justify-start text-left flex items-center ${
                    isAssetManagementOpen || ["brand-management", "categories-management", "color-management"].includes(activeTab)
                      ? "bg-primary-800 text-white rounded-lg hover:bg-primary-900 hover:text-white font-urbanist font-medium"
                      : "text-white hover:bg-primary-900 hover:text-white font-urbanist font-medium"
                  }`}
                  onClick={() => setIsAssetManagementOpen(!isAssetManagementOpen)}
                >
                  <Tags className="h-6 w-6 mr-3 flex-shrink-0" />
                  <span className="flex-1">Website Setup</span>
                  {isAssetManagementOpen ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  )}
                </Button>
                
                {isAssetManagementOpen && (
                  <div className="mt-1 ml-4 space-y-1 border-l-2 border-primary-700 pl-3">
                    {assetManagementItems.map((item) => {
                      const Icon = item.icon
                      const isActive = activeTab === item.id
                      
                      return (
                        <Button
                          key={item.id}
                          variant="ghost"
                          className={`w-full h-10 px-3 justify-start text-left flex items-center ${
                            isActive
                              ? "bg-primary-800 text-white rounded-lg hover:bg-primary-900 hover:text-white font-urbanist font-medium"
                              : "text-white hover:bg-primary-900 hover:text-white font-urbanist font-medium"
                          }`}
                          onClick={() => onTabChange(item.id)}
                        >
                          <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                          <span className="flex-1 text-sm">{item.label}</span>
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* Collapsed view for Partner Management - Only for Admin */}
            {userType === "admin" && isCollapsed && partnerManagementItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-10 h-10 mx-auto ${
                    isActive
                      ? "bg-primary-800 text-white rounded-full hover:bg-primary-900 hover:text-white justify-center font-urbanist font-medium"
                      : "text-white hover:bg-primary-900 hover:text-white justify-center font-urbanist font-medium"
                  } px-0 flex items-center`}
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                </Button>
              )
            })}

            {/* Collapsed view for Asset Management - Only for Admin */}
            {userType === "admin" && isCollapsed && assetManagementItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-10 h-10 mx-auto ${
                    isActive
                      ? "bg-primary-800 text-white rounded-full hover:bg-primary-900 hover:text-white justify-center font-urbanist font-medium"
                      : "text-white hover:bg-primary-900 hover:text-white justify-center font-urbanist font-medium"
                  } px-0 flex items-center`}
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Separator */}
        <div className={`${isCollapsed ? "px-2" : "px-4"} mb-6`}>
          <div className="border-t border-white"></div>
        </div>

        {/* User Actions Section */}
        <div className={`${isCollapsed ? "px-2" : "px-4"} mb-6`}>
          <nav className="space-y-1">
            {userActionItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`${
                    isCollapsed ? "w-10 h-10 mx-auto" : "w-full h-10"
                  } ${
                    isActive
                      ? isCollapsed 
                        ? "bg-primary-800 text-white rounded-full hover:bg-primary-900 hover:text-white justify-center"
                        : "bg-primary-800 text-white rounded-lg hover:bg-primary-900 hover:text-white"
                      : isCollapsed
                        ? "text-white hover:bg-primary-900 hover:text-white justify-center"
                        : "text-white hover:bg-primary-900 hover:text-white"
                  } ${isCollapsed ? "px-0" : "px-3 justify-start text-left"} flex items-center`}
                  onClick={() => {
                    if (item.id === "logout") {
                      handleLogout()
                    } else {
                      onTabChange(item.id)
                    }
                  }}
                >
                  <div className={`flex items-center w-full ${isCollapsed ? "justify-center" : ""}`}>
                    <Icon className={`${isCollapsed ? "h-4 w-4" : "h-6 w-6 mr-3"} flex-shrink-0`} />
                    {!isCollapsed && (
                      <span className="flex-1">{item.label}</span>
                    )}
                  </div>
                </Button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* User Profile Section - Always at bottom */}
      <div className="border-t border-white flex-shrink-0 mt-auto">
        {!isCollapsed && (
          <div className="p-3 flex items-center space-x-3 cursor-pointer hover:bg-primary-900 transition-colors">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white">Welcome back 👋</div>
              <div className="text-sm font-semibold text-white truncate">{userName}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-white flex-shrink-0" />
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center py-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
          </div>
        )}
      </div>
      </div>
      
      {/* Overlay when slider is open */}
      {isSliderOpen && (
        <div 
          className="fixed left-0 top-0 bg-white bg-opacity-50 z-[51] transition-all duration-10 pointer-events-auto"
          style={{
            width: isCollapsed ? "102px" : "280px",
            height: "calc(100vh - 0rem)"
          }}
        />
      )}
    </div>
  )
}


