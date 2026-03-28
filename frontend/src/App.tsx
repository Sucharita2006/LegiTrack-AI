import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/layout";
import { DashboardPage } from "@/pages/Dashboard";
import { BillsPage } from "@/pages/Bills";
import { BillDetailPage } from "@/pages/BillDetail";
import { DigestPage } from "@/pages/Digest";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/bills" element={<BillsPage />} />
          <Route path="/bills/:billId" element={<BillDetailPage />} />
          <Route path="/digest" element={<DigestPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
