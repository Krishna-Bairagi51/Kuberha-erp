"use client"
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopTheLookMainPage } from "@/components/features/website-setup/components/shop-the-look/main-page";
import PageHeader from "@/components/shared/layout/page-header";

export default function ShopTheLookPage() {
  const router = useRouter();

  const handleAddLook = () => {
    router.push("/admin-dashboard/shop-the-look/add-look");
  };

  return (
    <div>
      <PageHeader 
        title="Shop The Look"
        action={
          <Button
            onClick={handleAddLook}
            className="h-[30px] px-3 bg-secondary-900 hover:bg-secondary-800 hover:text-white font-urbanist font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Look
          </Button>
        }
      />
      <ShopTheLookMainPage />
    </div>
  );
}