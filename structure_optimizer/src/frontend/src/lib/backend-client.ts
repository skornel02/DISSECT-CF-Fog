import createClient from "openapi-fetch";
import {paths} from "@/lib/backend";

export const client = createClient<paths>();
