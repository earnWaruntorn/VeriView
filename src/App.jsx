import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ResultPage from "./pages/ResultPage";
import DetailPage from "./pages/DetailPage";
import AdminPage from "./pages/AdminPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import LogResultPage from "./pages/LogResultPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/result/detail" element={<DetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/log-result" element={<LogResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;