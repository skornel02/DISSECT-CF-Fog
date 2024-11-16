import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {createHashRouter, RouterProvider} from "react-router-dom";
import {routes} from "@/routes.tsx";
import './index.css'

const router = createHashRouter(routes);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router}/>
    </StrictMode>,
)
