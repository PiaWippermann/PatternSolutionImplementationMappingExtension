import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getRepositoryIds,
  getDiscussionsListData,
  getDiscussionDetails,
  parsePattern,
  parseSolution,
  parseMapping
} from "../api";
import { PAGE_SIZE } from "../config";
import type {
  DiscussionData,
  RepositoryIds,
  Pattern,
  SolutionImplementation,
  PatternSolutionMapping,
  ListData
} from "../types/DiscussionData";
// Define the type for the callback function used in fetchDiscussionList
type FetchListCallback = (data: ListData) => void;
// Define the shape of the context
type DiscussionDataContextType = {
  discussionData: DiscussionData;
  fetchDiscussionList: (categoryId: string, cursor: string | null, onDataFetched: FetchListCallback) => Promise<void>;
  fetchDiscussionDetailsByNumber: (categoryId: string, discussionNumber: number) => Promise<Pattern | SolutionImplementation | undefined>;
  fetchMappingDiscussionByNumber: (discussionNumber: number) => Promise<PatternSolutionMapping | undefined>;
  addOrUpdatePatternData: (newPattern: Pattern) => void;
  addOrUpdateSolutionImplementationData: (newSolutionImplementation: SolutionImplementation) => void;
  addOrUpdateMappingData: (newMapping: PatternSolutionMapping) => void;
  clearListCache: (type: 'patterns' | 'solutionImplementations') => void;
  clearAllCache: () => void;
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
  clearListCache: () => { },
  clearAllCache: () => { },
  ids: {
    repositoryId: "",
    solutionImplementationCategoryId: "",
    patternCategoryId: "",
    patternSolutionMappingCategoryId: "",
  },
  loading: true,
  error: null,
});
// Custom hook to use the DiscussionDataContext
// eslint-disable-next-line react-refresh/only-export-components
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
      const cachedData = discussionData?.[type].listData[cursor || 'null'];
      // 💡 Return data via the callback
      onDataFetched(cachedData);
      return;
    }
    // Data needs to be fetched from GitHub
    setLoading(true);
    setError(null); // Clear any previous errors
    try {
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
      // 💡 Return data via the callback after the state has been updated
      onDataFetched({
        discussions: response.nodes,
        pageInfo: response.pageInfo,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Data could not be loaded.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [ids, discussionData]);
  // Function to fetch details of a specific discussion by its ID
  // This is used when navigating to the detail view of a pattern or solution implementation
  // It first checks the cache, and if not found, fetches from GitHub
  const fetchDiscussionDetailsByNumber = useCallback(async (categoryId: string, discussionNumber: number) => {
    const type = categoryId === ids?.patternCategoryId ? 'patterns' : 'solutionImplementations';
    let cachedDetails: Pattern | SolutionImplementation | undefined;
    if (type == "patterns") {
      cachedDetails = discussionData?.patterns.details.find(d => d.number === discussionNumber);
    } else if (type == "solutionImplementations") {
      cachedDetails = discussionData?.solutionImplementations.details.find(d => d.number === discussionNumber);
    }
    if (cachedDetails) {
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
        const fullPatternData = parsePattern(response);
        setDiscussionData(prevData => ({
          ...prevData,
          patterns: {
            ...prevData.patterns,
            details: [...prevData.patterns.details, fullPatternData],
          },
        }));
        return fullPatternData;
      } else if (type === "solutionImplementations") {
        const fullSolutionData = parseSolution(response);
        setDiscussionData(prevData => ({
          ...prevData,
          solutionImplementations: {
            ...prevData.solutionImplementations,
            details: [...prevData.solutionImplementations.details, fullSolutionData],
          },
        }));
        return fullSolutionData;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Details could not be loaded.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [discussionData, ids?.patternCategoryId]);
  const fetchMappingDiscussionByNumber = useCallback(async (discussionNumber: number) => {
    // Check if the patternSolutionMapping is already cached
    const cachedDetails = discussionData?.patternSolutionMappings.find(d => d.number == discussionNumber);
    if (cachedDetails) {
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
      const fullMappingData = parseMapping(response);
      if (!fullMappingData.patternDiscussionNumber || !fullMappingData.solutionImplementationDiscussionNumber) {
        // Mapping discussion body is not in the right format, ignore this discussion
        return;
      }
      setDiscussionData(prevData => ({
        ...prevData,
        patternSolutionMappings: [
          ...prevData.patternSolutionMappings,
          fullMappingData
        ],
      }));
      return fullMappingData;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Mapping discussion could not be loaded.";
      setError(errorMessage);
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Repository ids could not be loaded.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  // Add a new pattern to the context state
  const addOrUpdatePatternData = (newPattern: Pattern) => {
    // Check if there is an existing pattern with the same id
    const existingPattern = discussionData.patterns.details.find(x => x.id == newPattern.id);
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
    const existingSolution = discussionData.solutionImplementations.details.find(x => x.id == newSolutionImplementation.id);
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
    const existingMapping = discussionData.patternSolutionMappings.find(x => x.id == newMapping.id);
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
    }
  };
  // Clear list cache for a specific type to force reload
  const clearListCache = (type: 'patterns' | 'solutionImplementations') => {
    setDiscussionData(prevData => ({
      ...prevData,
      [type]: {
        ...prevData[type],
        listData: {},
        currentPageCursor: null,
      },
    }));
  };

  // Clear all cached data (lists, details, and mappings)
  const clearAllCache = () => {
    setDiscussionData({
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
  };

  // fetch repo ids on mount
  useEffect(() => {
    fetchRepoIds();
  }, [fetchRepoIds]);
  return (
    <DiscussionDataContext.Provider
      value={{
        ids, loading, error, discussionData, fetchDiscussionList, fetchDiscussionDetailsByNumber, fetchMappingDiscussionByNumber, addOrUpdatePatternData, addOrUpdateSolutionImplementationData, addOrUpdateMappingData, clearListCache, clearAllCache
      }}
    >
      {children}
    </DiscussionDataContext.Provider>
  );
};
