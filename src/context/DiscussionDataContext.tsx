import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { parsePatternBody } from "../api/githubPatterns";
import { parseSolutionBody } from "../api/githubSolutions";
import { parseMappingBody } from "../api/githubMappings";
import { getRepositoryIds, getDiscussionsListData, getDiscussionDetails } from "../api/githubQueries";
import type {
  DiscussionData,
  RepositoryIds,
  Pattern,
  SolutionImplementation,
  PatternSolutionMapping,
  ListData
} from "../types/DiscussionData";

// Define the type for the callback function used in fetchDiscussionList
type FetchListCallback = ({ }: ListData) => void;

// Define the shape of the context
type DiscussionDataContextType = {
  discussionData: DiscussionData;
  fetchDiscussionList: (categoryId: string, cursor: string | null, onDataFetched: FetchListCallback) => Promise<void>;
  fetchDiscussionDetailsByNumber: (categoryId: string, discussionNumber: number) => Promise<Pattern | SolutionImplementation | undefined>;
  fetchMappingDiscussionByNumber: (discussionNumber: number) => Promise<PatternSolutionMapping | undefined>;
  addOrUpdatePatternData: (newPattern: Pattern) => void;
  addOrUpdateSolutionImplementationData: (newSolutionImplementation: SolutionImplementation) => void;
  addOrUpdateMappingData: (newMapping: PatternSolutionMapping) => void;
  ids: RepositoryIds;
  loading: boolean;
  error: string | null;
};

// Create the context with default values
const DiscussionDataContext = createContext<DiscussionDataContextType>({
  discussionData: {
    patterns: {
      details: [],
      listData: {},
      currentPageCursor: null,
    },
    solutionImplementations: {
      details: [],
      listData: {},
      currentPageCursor: null,
    },
    patternSolutionMappings: [],
  },
  fetchDiscussionList: async () => { },
  fetchDiscussionDetailsByNumber: async () => { return undefined; },
  fetchMappingDiscussionByNumber: async () => { return undefined },
  addOrUpdatePatternData: () => { },
  addOrUpdateSolutionImplementationData: () => { },
  addOrUpdateMappingData: () => { },
  ids: {
    repositoryId: "",
    solutionImplementationCategoryId: "",
    patternCategoryId: "",
    patternSolutionMappingCategoryId: "",
  },
  loading: true,
  error: null,
});

// Define constants for pagination and category IDs
const PAGE_SIZE = 10; // Number of items per page

// Custom hook to use the DiscussionDataContext
export const useDiscussionData = () => useContext(DiscussionDataContext);

// Provider component to wrap the app and provide the context
export const DiscussionDataProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [discussionData, setDiscussionData] = useState<DiscussionData>({
    patterns: {
      details: [],
      listData: {},
      currentPageCursor: null,
    },
    solutionImplementations: {
      details: [],
      listData: {},
      currentPageCursor: null,
    },
    patternSolutionMappings: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ids, setIds] = useState<RepositoryIds>({
    repositoryId: "",
    solutionImplementationCategoryId: "",
    patternCategoryId: "",
    patternSolutionMappingCategoryId: "",
  });

  // Dynamic fetching of discussions (overview) with pagination
  // The `cursor` parameter is now a string or null.
  const fetchDiscussionList = useCallback(async (categoryId: string, cursor: string | null, onDataFetched: FetchListCallback) => {
    const type = categoryId === ids?.patternCategoryId ? 'patterns' : 'solutionImplementations';

    // Check if the request has already been made using the cursor as the key
    if (discussionData?.[type].listData[cursor || 'null']) {
      console.log(`Data for ${type} with cursor ${cursor} already loaded.`);
      const cachedData = discussionData?.[type].listData[cursor || 'null'];
      // 💡 Daten über den Callback zurückgeben
      onDataFetched(cachedData);
      return;
    }

    // Data needs to be fetched from GitHub
    setLoading(true);
    setError(null); // Clear any previous errors

    try {
      console.log(`Fetch data for ${type} with cursor ${cursor} from GitHub API`)
      const response = await getDiscussionsListData(categoryId, cursor, PAGE_SIZE);

      setDiscussionData(prevData => {
        const key = cursor || 'null';
        const dataToCache = {
          discussions: response.nodes,
          pageInfo: response.pageInfo,
        };

        return {
          ...prevData,
          [type]: {
            ...prevData[type],
            listData: {
              ...prevData[type].listData,
              [key]: dataToCache,
            },
            currentPageCursor: cursor,
          },
        };
      });

      // 💡 Daten über den Callback zurückgeben, nachdem der State aktualisiert wurde
      onDataFetched({
        discussions: response.nodes,
        pageInfo: response.pageInfo,
      });

    } catch (err: any) {
      setError(err.message || "Data could not be loaded.");
      console.error(`Error loading ${type}:`, err);
    } finally {
      setLoading(false);
    }
  }, [ids, discussionData]);

  // Function to fetch details of a specific discussion by its ID
  // This is used when navigating to the detail view of a pattern or solution implementation
  // It first checks the cache, and if not found, fetches from GitHub
  const fetchDiscussionDetailsByNumber = useCallback(async (categoryId: string, discussionNumber: number) => {
    const type = categoryId === ids?.patternCategoryId ? 'patterns' : 'solutionImplementations';
    let cachedDetails: any;

    if (type == "patterns") {
      cachedDetails = discussionData?.patterns.details.find(d => d.number === discussionNumber);
    } else if (type == "solutionImplementations") {
      cachedDetails = discussionData?.solutionImplementations.details.find(d => d.number === discussionNumber);
    }

    if (cachedDetails) {
      console.log(`Details for discussion ${discussionNumber} already loaded from cache.`);
      // return the found details
      return cachedDetails;
    }

    // 2. Load the data if not in cache
    setLoading(true);
    setError(null);

    try {
      const response = await getDiscussionDetails(discussionNumber);

      if (!response) {
        setError("Discussion not found.");
        return;
      }
      // Based on the type the response body needs to be parsed and the details stored in the correct array
      if (type === "patterns") {
        const patternData = parsePatternBody(response.body);
        const fullPatternData: Pattern = {
          ...response,
          icon: patternData.icon || "",
          description: patternData.description || "",
          patternRef: patternData.patternRef || "",
          mappings: patternData.mappings || [],
        };

        setDiscussionData(prevData => ({
          ...prevData,
          patterns: {
            ...prevData.patterns,
            details: [...prevData.patterns.details, fullPatternData],
          },
        }));

        return fullPatternData;
      } else if (type === "solutionImplementations") {
        const solutionData = parseSolutionBody(response.body);
        const fullSolutionData: SolutionImplementation = {
          ...response,
          solutionRefUrl: solutionData.solutionRefUrl || "",
          description: solutionData.description || "",
          mappings: solutionData.mappings || [],
        };

        setDiscussionData(prevData => ({
          ...prevData,
          solutionImplementations: {
            ...prevData.solutionImplementations,
            details: [...prevData.solutionImplementations.details, fullSolutionData],
          },
        }));

        return fullSolutionData;
      }
    } catch (err: any) {
      setError(err.message || "Details could not be loaded.");
      console.error(`Error loading details for ${discussionNumber}:`, err);
    } finally {
      setLoading(false);
    }
  }, [discussionData]);

  const fetchMappingDiscussionByNumber = useCallback(async (discussionNumber: number) => {
    // Check if the patternSolutionMapping is already cached
    const cachedDetails = discussionData?.patternSolutionMappings.find(d => d.number == discussionNumber);
    if (cachedDetails) {
      console.log("Mapping discussion found in cache")
      return cachedDetails;
    }

    // Load the discussion from the GitHub GraphQL API if it is not in the cache
    setLoading(true);
    setError(null);

    try {
      const response = await getDiscussionDetails(discussionNumber);

      if (!response) {
        setError("Discussion not found.");
        return;
      }

      const mappingData = parseMappingBody(response.body);

      if (!mappingData.patternDiscussionNumber || !mappingData.solutionImplementationDiscussionNumber) {
        // Mapping discussion body is not in the right format, ignore this discussion
        return;
      }

      const fullMappingData: PatternSolutionMapping = {
        ...response,
        patternDiscussionNumber: parseInt(mappingData.patternDiscussionNumber),
        solutionImplementationDiscussionNumber: parseInt(mappingData.solutionImplementationDiscussionNumber)
      };

      setDiscussionData(prevData => ({
        ...prevData,
        patternSolutionMappings: [
          ...prevData.patternSolutionMappings,
          fullMappingData
        ],
      }));

      return fullMappingData;
    } catch (err: any) {
      setError(err.message || "Mapping discussion could not be loaded.");
      console.error(`Error loading details for ${discussionNumber}:`, err);
    } finally {
      setLoading(false);
    }
  }, [discussionData]);

  // Function to fetch repository IDs
  // Called when the component mounts for the first time
  const fetchRepoIds = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear any previous errors

    try {
      const repoId = await getRepositoryIds();
      setIds(repoId);

    } catch (err: any) {
      console.error("Error when loading repository ids:", err);
      setError(err.message || "Repository ids could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new pattern to the context state
  const addOrUpdatePatternData = (newPattern: Pattern) => {
    console.log("Adding/updating pattern in context state:", newPattern);
    // Check if there is an existing pattern with the same id
    let existingPattern = discussionData.patterns.details.find(x => x.id == newPattern.id);
    console.log("Existing pattern found in context state:", existingPattern);

    if (existingPattern) {
      // Update only the details entry of the discussion data patterns for the given existing pattern
      setDiscussionData(prevData => ({
        ...prevData,
        patterns: {
          ...prevData.patterns,
          details: [
            newPattern,
            ...prevData.patterns.details.filter(x => x.id !== newPattern.id),
          ],
        },
      }));

      console.log("Pattern details updated in context state", discussionData.patterns.details);
    } else {
      // Completely add the new pattern data
      setDiscussionData(prevData => {
        // 1. Create a new patterns object with the new pattern added to details
        const newPatterns = {
          ...prevData.patterns,
          details: [newPattern, ...prevData.patterns.details],
          listData: { ...prevData.patterns.listData }
        };

        // First, check if any of the listData already include the new pattern
        const existingPage = Object.values(newPatterns.listData).find(page =>
          page.discussions.some(discussion => discussion.id === newPattern.id)
        );

        // Add the new pattern to the list data if it is not found in the list data
        if (!existingPage) {
          // 2. Update the listData to include the new pattern in the first page if it exists
          const firstPage = newPatterns.listData['null']
            ? { ...newPatterns.listData['null'] }
            : null;

          if (firstPage) {
            // 3. Create a simplified object for the list
            const simplifiedPattern = {
              id: newPattern.id,
              title: newPattern.title,
              number: newPattern.number,
            };

            firstPage.discussions = [simplifiedPattern, ...firstPage.discussions];

            if (firstPage.discussions.length > PAGE_SIZE) {
              firstPage.discussions.pop();
              const keysToRemove = Object.keys(newPatterns.listData).filter(key => key !== 'null');
              for (const key of keysToRemove) {
                delete newPatterns.listData[key];
              }
            }
            // 4. Update the first page in listData
            newPatterns.listData['null'] = firstPage;
          } else {
            newPatterns.listData['null'] = {
              discussions: [{
                id: newPattern.id,
                title: newPattern.title,
                number: newPattern.number,
              }],
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            };
          }
        }

        return {
          ...prevData,
          patterns: newPatterns
        };
      });
    }
  };

  // Add a new solution implementation to the context state
  const addOrUpdateSolutionImplementationData = (newSolutionImplementation: SolutionImplementation) => {
    // Check if there is an existing solution with the same id
    let existingSolution = discussionData.solutionImplementations.details.find(x => x.id == newSolutionImplementation.id);

    if (existingSolution) {
      // Update only the details entry of the discussion data solutionImplementations for the given existing solution
      setDiscussionData(prevData => ({
        ...prevData,
        solutionImplementations: {
          ...prevData.solutionImplementations,
          details: [
            newSolutionImplementation,
            ...prevData.solutionImplementations.details.filter(x => x.id !== newSolutionImplementation.id),
          ],
        },
      }));
    } else {
      // Completely add the new solution implementation data
      setDiscussionData(prevData => {
        // 1. Create a new solutionImplementations object with the new solution added to details
        const newSolutions = {
          ...prevData.solutionImplementations,
          details: [newSolutionImplementation, ...prevData.solutionImplementations.details],
          listData: { ...prevData.solutionImplementations.listData }
        };

        // First, check if any of the listData already include the new solution
        const existingPage = Object.values(newSolutions.listData).find(page =>
          page.discussions.some(discussion => discussion.id === newSolutionImplementation.id)
        );

        // Add the new solution to the list data if it is not found in the list data
        if (!existingPage) {

          // 2. Update the listData to include the new solution in the first page if it exists
          const firstPage = newSolutions.listData['null']
            ? { ...newSolutions.listData['null'] }
            : null; // 'null' key for the first page

          if (firstPage) {
            // 3. Create a simplified object for the list
            const simplifiedSolution = {
              id: newSolutionImplementation.id,
              title: newSolutionImplementation.title,
              number: newSolutionImplementation.number,
            };

            firstPage.discussions = [simplifiedSolution, ...firstPage.discussions];
            if (firstPage.discussions.length > PAGE_SIZE) {
              firstPage.discussions.pop();
              const keysToRemove = Object.keys(newSolutions.listData).filter(key => key !== 'null');
              for (const key of keysToRemove) {
                delete newSolutions.listData[key];
              }
            }
            // 4. Update the first page in listData
            newSolutions.listData['null'] = firstPage;
          }
          else {
            newSolutions.listData['null'] = {
              discussions: [{
                id: newSolutionImplementation.id,
                title: newSolutionImplementation.title,
                number: newSolutionImplementation.number,
              }],
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            };
          }
        }

        return {
          ...prevData,
          solutionImplementations: newSolutions
        };
      });
    }
  };

  // Add a new mapping to the context state
  const addOrUpdateMappingData = (newMapping: PatternSolutionMapping) => {
    // Check if there is an existing mapping with the same id and update if existing 
    let existingMapping = discussionData.patternSolutionMappings.find(x => x.id == newMapping.id);

    if (existingMapping) {
      // Update the discussionData existing mapping entry
      setDiscussionData(prevData => ({
        ...prevData,
        patternSolutionMappings: [
          newMapping,
          ...prevData.patternSolutionMappings.filter(x => x.id !== newMapping.id),
        ],
      }));
    } else {
      // Add the new mapping to the discussionData
      setDiscussionData(prevData => ({
        ...prevData,
        patternSolutionMappings: [newMapping, ...prevData.patternSolutionMappings],
      }));

      console.log("New mapping added to context state", discussionData.patternSolutionMappings);
    }
  };

  // fetch repo ids on mount
  useEffect(() => {
    fetchRepoIds();
  }, []);

  return (
    <DiscussionDataContext.Provider
      value={{
        ids, loading, error, discussionData, fetchDiscussionList, fetchDiscussionDetailsByNumber, fetchMappingDiscussionByNumber, addOrUpdatePatternData, addOrUpdateSolutionImplementationData, addOrUpdateMappingData
      }}
    >
      {children}
    </DiscussionDataContext.Provider>
  );
};

