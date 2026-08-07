import dotenv from "dotenv";
import type { PipedrivePerson } from "./types/pipedrive";
import inputData from "./mappings/inputData.json";
import mappings from "./mappings/mappings.json";

dotenv.config();

const apiKey = process.env.PIPEDRIVE_API_KEY;
const companyDomain = process.env.PIPEDRIVE_COMPANY_DOMAIN;

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const syncPdPerson = async (): Promise<PipedrivePerson> => {
  try {

    if (!apiKey || !companyDomain) {
      throw new Error("Missing PIPEDRIVE_API_KEY or PIPEDRIVE_COMPANY_DOMAIN in environment variables.");
    }

    const baseUrl = `https://${companyDomain}.pipedrive.com/api/v1`;
    const payload: Record<string, any> = {};
    let searchName = "";

    for (const mapping of mappings) {
      const value = getNestedValue(inputData, mapping.inputKey);

      if (value !== undefined) {
        payload[mapping.pipedriveKey] = value;
      }

      if (mapping.pipedriveKey === "name") {
        searchName = value as string;
      }
    }

    if (!searchName) {
      throw new Error("Cannot sync: The 'name' field is missing from inputData or mappings.json.");
    }

    const searchUrl = `${baseUrl}/persons/search?term = ${encodeURIComponent(searchName)}&exact_match = true&api_token = ${apiKey}`;
    const searchRes = await fetch(searchUrl);

    if (!searchRes.ok) {
      throw new Error(`Pipedrive API search failed with status: ${searchRes.status}`);
    }

    const searchData = await searchRes.json();

    const searchItems = searchData.data?.items || [];
    const existingPersonId = searchItems.length > 0 ? searchItems[0].item.id : null;

    let finalPerson: PipedrivePerson;

    if (existingPersonId) {

      const updateUrl = `${baseUrl}/persons/${existingPersonId}?api_token = ${apiKey}`;
      const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const updateData = await updateRes.json();

      if (!updateData.success) {
        throw new Error(`Failed to update person: ${updateData.error}`);
      }
      finalPerson = updateData.data;
      console.log(`Successfully updated existing person ID: ${existingPersonId}`);

    } else {

      const createUrl = `${baseUrl}/persons?api_token = ${apiKey}`;
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const createData = await createRes.json();

      if (!createData.success) {
         throw new Error(`Failed to create person: ${createData.error}`);
      }
      finalPerson = createData.data;
      console.log(`Successfully created new person ID: ${finalPerson.id}`);
    }

    return finalPerson;
  } catch (error) {

    console.error("Error during syncPdPerson execution:", error);
    throw error;
  }
};

const pipedrivePerson = syncPdPerson();

pipedrivePerson.then((person) => {
    console.log("Final Synced Object:", person);
}).catch(console.error);
