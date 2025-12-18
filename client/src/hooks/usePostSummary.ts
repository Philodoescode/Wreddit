import {useState, useCallback, useEffect} from 'react';
import api from '@/lib/api';
import type {SummaryResponse, SummaryState, SummaryErrorType} from '@/types/summary';

export function usePostSummary(postId: string) {
    const [state, setState] = useState<SummaryState>({
        summary: null,
        loading: false,
        error: null,
    });
    const [fromCache, setFromCache] = useState<boolean>(false);
    const [includesComments, setIncludesComments] = useState<boolean>(false);
    const [commentsAnalyzed, setCommentsAnalyzed] = useState<number>(0);
    const [initialLoading, setInitialLoading] = useState<boolean>(true);

    const getErrorMessage = (error: any): { message: string; type: SummaryErrorType } => {
        // Network errors
        if (!error.response) {
            return {
                message: 'Network error. Please check your connection and try again.',
                type: 'network'
            };
        }

        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;

        // Timeout
        if (status === 504) {
            return {
                message: 'Request timed out. The AI service is taking too long. Please try again.',
                type: 'timeout'
            };
        }

        // Rate limiting
        if (status === 429) {
            return {
                message: 'Too many requests. Please wait a moment and try again.',
                type: 'rate_limit'
            };
        }

        // Server errors
        if (status >= 500) {
            return {
                message: serverMessage || 'Server error. Please try again later.',
                type: 'server_error'
            };
        }

        // Client errors
        if (status >= 400) {
            return {
                message: serverMessage || 'Unable to generate summary for this post.',
                type: 'invalid_response'
            };
        }

        return {
            message: 'An unexpected error occurred. Please try again.',
            type: 'unknown'
        };
    };

    // Check for existing summary on mount
    useEffect(() => {
        const fetchExistingSummary = async () => {
            try {
                const response = await api.get<SummaryResponse>(`/posts/${postId}/summary`);

                if (response.data.status === 'success' && response.data.data) {
                    setState({
                        summary: response.data.data.summary,
                        loading: false,
                        error: null,
                    });
                    setFromCache(true);
                    setIncludesComments(response.data.data.includesComments ?? false);
                    setCommentsAnalyzed(response.data.data.commentsAnalyzed ?? 0);
                }
            } catch {
                // 404 means no summary exists yet - that's fine, just show the generate button
                // Other errors are also fine - user can still generate
            } finally {
                setInitialLoading(false);
            }
        };

        fetchExistingSummary();
    }, [postId]);

    const generateSummary = useCallback(async () => {
        setState({
            summary: null,
            loading: true,
            error: null,
        });

        try {
            const response = await api.post<SummaryResponse>(`/posts/${postId}/summarize`);

            if (response.data.status === 'success' && response.data.data) {
                setState({
                    summary: response.data.data.summary,
                    loading: false,
                    error: null,
                });
                setFromCache(response.data.data.fromCache ?? false);
                setIncludesComments(response.data.data.includesComments ?? false);
                setCommentsAnalyzed(response.data.data.commentsAnalyzed ?? 0);
            }

        } catch (error: any) {
            const {message, type} = getErrorMessage(error);

            setState({
                summary: null,
                loading: false,
                error: message,
            });

            console.error('Summary generation error:', {type, error});
        }
    }, [postId]);

    const clearSummary = useCallback(() => {
        setState({
            summary: null,
            loading: false,
            error: null,
        });
        setFromCache(false);
        setIncludesComments(false);
        setCommentsAnalyzed(0);
    }, []);

    const retry = useCallback(async () => {
        // Force regeneration by passing regenerate=true
        setState({
            summary: null,
            loading: true,
            error: null,
        });

        try {
            const response = await api.post<SummaryResponse>(`/posts/${postId}/summarize?regenerate=true`);

            if (response.data.status === 'success' && response.data.data) {
                setState({
                    summary: response.data.data.summary,
                    loading: false,
                    error: null,
                });
                setFromCache(false);
                setIncludesComments(response.data.data.includesComments ?? false);
                setCommentsAnalyzed(response.data.data.commentsAnalyzed ?? 0);
            }

        } catch (error: any) {
            const {message} = getErrorMessage(error);
            setState({
                summary: null,
                loading: false,
                error: message,
            });
        }
    }, [postId]);

    return {
        ...state,
        fromCache,
        includesComments,
        commentsAnalyzed,
        initialLoading,
        generateSummary,
        clearSummary,
        retry,
    };
}
