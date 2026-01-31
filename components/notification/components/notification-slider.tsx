"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useNotification } from '../providers'
import NotificationSection from './notification-section'
import { Button } from '@/components/ui/button'

function NotificationSlider() {
  const { isOpen, closeNotification } = useNotification()

  const handleMarkAllRead = () => {
    // TODO: Implement mark all as read functionality
  }

  return (
    <Sheet open={isOpen} onOpenChange={closeNotification}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden">
        <div className="flex h-full flex-col">
          <SheetHeader className="shrink-0 py-[15px] px-[8px] border-b border-gray-200">
            <SheetTitle className="font-medium font-semibold text-gray-900 font-urbanist label-1"> 
                <span className="flex items-center gap-2">
                    Recent Notifications
                </span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto mt-4 relative bg-gray-50">
            <NotificationSection variant="slider" />
          </div>
          {/* <div className="shrink-0 border-t bg-white p-4 sticky bottom-0">
            <Button 
              onClick={handleMarkAllRead}
              className="w-full text-sm"
            >
              Mark All as Read
            </Button>
          </div> */}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default NotificationSlider

