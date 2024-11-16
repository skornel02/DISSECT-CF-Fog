import {RouteObject} from "react-router-dom";
import IndexPage from "@/pages";
import Layout from "@/layout.tsx";
import RandomSimulationPage from "@/pages/simulations/random/random-simulation-page.tsx";
import GeneticSimulationPage from "@/pages/simulations/genetic/genetic-simulation-page.tsx";
import SimulationStatusPage from "@/pages/simulations/status/simulation-status-page.tsx";

export const routes: RouteObject[] = [
    {
        path: "/",
        element: <Layout/>,
        id: '#Home',
        children: [
            {
                path: "/",
                element: <IndexPage/>,
            },
            {
                path: "/simulations",
                children: [
                    {
                        id: '#Random simulation',
                        path: '/simulations/random',
                        element: <RandomSimulationPage/>,
                    },
                    {
                        id: '#Genetic simulation',
                        path: '/simulations/genetic',
                        element: <GeneticSimulationPage/>,
                    },
                    {
                        id: "#Simulation status",
                        path: '/simulations/:id',
                        element: <SimulationStatusPage/>
                    }
                ]
            }
        ]
    }
]
