import './App.css';
import { Home } from './Pages/Home/Home';
import { Sidebar } from './Components/Sidebar/Sidebar';
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Sidebar />
      <Routes>
        <Route path="/Orders" element={<Home/>} />
        {/* <Route path="/project" component={Projects} />
        <Route path="/about" component={About} />
        <Route path="/resume" component={Resume} />
        <Route path="/contacts" component={Contacts} /> */}
      </Routes>
      {/* <Footer /> */}
  </BrowserRouter>
  );
}

export default App;
