import "./App.css";
import { BrandProvider } from "./brand";
import { Admin } from "./Pages/Admin/Admin";
import { Home } from "./Pages/Home/Home";
import { Sidebar } from "./Components/Sidebar/Sidebar";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";

function App() {
  return (
    // GitHub Pages cannot serve paths like /Orders: the route lives after the #
    <BrandProvider>
    <HashRouter>
      <Sidebar />
      <Routes>
        <Route path="/" element={<Navigate to="/Orders" replace />} />
        <Route path="/Orders" element={<Home />} />
        <Route path="/Admin" element={<Admin />} />
        {/* <Route path="/project" component={Projects} />
        <Route path="/about" component={About} />
        <Route path="/resume" component={Resume} />
        <Route path="/contacts" component={Contacts} /> */}
      </Routes>
      {/* <Footer /> */}
    </HashRouter>
    </BrandProvider>
  );
}

export default App;
