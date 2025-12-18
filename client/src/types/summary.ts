export interface SummaryResponse {
    status: 'success' | 'fail';
    data?: {
        summary: string;
        postId: string;
        generatedAt: string;
        fromCache?: boolean;
        includesComments?: boolean;
        commentsAnalyzed?: number;
    };
    message?: string;
}

export interface SummaryState {
    summary: string | null;
    loading: boolean;
    error: string | null;
}

export type SummaryErrorType =
    | 'network'
    | 'timeout'
    | 'rate_limit'
    | 'invalid_response'
    | 'server_error'
    | 'unknown';

