import {Button} from "@/components/ui/button.tsx";
import {useCallback} from "react";
import {client} from "@/lib/backend-client.ts";
import {useToast} from "@/hooks/use-toast.ts";
import {useNavigate} from "react-router-dom";
import {SchemaSimulationStructure} from "@/lib/backend";

export default function RandomSimulationPage() {
    const {toast} = useToast();
    // navigate with router
    const navigate = useNavigate();

    const startSimulation = useCallback(async () => {
        const {data, response} = await client.POST('/api/simulations/random', {
            body: {
                computerTypes: [],
                regions: [],
                regionConnections: [],
                instances: [],
                defaultLatency: 10,
            } satisfies SchemaSimulationStructure
        })

        if (!response.ok || !data) {
            toast({
                title: "Failed to start simulation",
                variant: 'destructive'
            })

            return;
        }

        toast({
            title: "Simulation started",
        })

        navigate(`/simulations/${data.guid}`);
    }, [])

    return (
        <div className="p-4">
            <h1 className="mb-2 text-xl">Random Simulation</h1>
            <Button onClick={startSimulation}>
                Start simulation
            </Button>
        </div>
    )
}
