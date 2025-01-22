import { useEffect, useState } from "react";
import CubeDashboard from "./pages/CubeDashboard";
import CubesListPage from "./pages/CubesListPage";
import ImagesList from "./pages/ImagesList";
import WorkspacesList from "./pages/WorkspacesList";
import Terminal from "./pages/Terminal";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState("");

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handlerSetPage = (page: string) => {
    setPage(page);
  };

  const renderPage = (): JSX.Element => {
    switch (page) {
      case "WorkspaceDashboard":
        return <WorkspacesList pageNavigator={handlerSetPage} />;
      case "CubesPage":
          return <CubesListPage  pageNavigator={handlerSetPage}  />;
      case "CubeDashboard":
        return <CubeDashboard pageNavigator={handlerSetPage} />;
      case "ImagesList":
        return <ImagesList pageNavigator={handlerSetPage} />;
      default:
        return <></>;
    }
  };

  useEffect(() => {
    const selectedPage = localStorage.getItem('selectedPage');
    if (selectedPage) {
      setPage(selectedPage)
    }
    else{
      setPage( "WorkspaceDashboard")
    }
    
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100">
      {/* Dark Mode Toggle Button */}
      <div className="p-4 flex justify-end">
        <button
          onClick={toggleDarkMode}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-md text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {renderPage()}
      <Terminal/>
    </div>
  );
}

export default App;