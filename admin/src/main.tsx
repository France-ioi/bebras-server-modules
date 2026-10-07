import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Route, Routes} from 'react-router';
import SearchPage from './pages/SearchPage';
import TaskPage from './pages/TaskPage';
import GenerationPage from './pages/GenerationPage';
import {Layout} from './ui/Layout';
import './style.css';

/* Same paths as the former server-rendered panel, so existing links keep working. */
function App() {
    return <Routes>
        <Route path="/" element={<SearchPage/>}/>
        <Route path="/task/:taskId" element={<TaskPage/>}/>
        <Route path="/task/:taskId/generation/:generationId" element={<GenerationPage/>}/>
        <Route path="*" element={<Layout title="Not found"><p className="warning">Unknown page.</p></Layout>}/>
    </Routes>
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <App/>
        </BrowserRouter>
    </StrictMode>
);
