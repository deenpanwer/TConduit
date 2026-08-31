import { Suspense } from "react";
import { DemoMasterDashboard } from "@/components/demo/DemoMasterDashboard";
import { DemoCalculatorModal } from "@/components/demo/DemoCalculatorModal";

export default function DemoPage() {
  return (
    <>
      <Suspense fallback={null}>
        <DemoCalculatorModal />
      </Suspense>
      <DemoMasterDashboard />
    </>
  );
}
