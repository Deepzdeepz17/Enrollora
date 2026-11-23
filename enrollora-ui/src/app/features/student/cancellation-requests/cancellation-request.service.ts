
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PagedResult } from '../../../shared/models/paged-result.model';

export interface CancellationResponse {
  cancellationRequestId: number;
  enrollmentId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseName: string;
  reason: string;
  status: number;
  requestedAt: string;
  reviewedAt: string | null;
  adminRemarks: string | null;
}

export interface CreateCancellationRequest {
  reason: string;
}

export interface ReviewCancellationRequest {
  adminRemarks?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CancellationRequestService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/cancellation-requests`;

  // Get student's cancellation requests
  getMyRequests(
    pageNumber = 1,
    pageSize = 10
  ): Observable<PagedResult<CancellationResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<PagedResult<CancellationResponse>>(
      `${this.apiUrl}/my`,
      { params }
    );
  }

  // Create cancellation request
  createRequest(
    enrollmentId: number,
    request: CreateCancellationRequest
  ): Observable<CancellationResponse> {
    return this.http.post<CancellationResponse>(
      `${environment.apiUrl}/enrollments/${enrollmentId}/cancellation-request`,
      request
    );
  }

  // Get all cancellation requests (Admin)
  getAllRequests(
    pageNumber = 1,
    pageSize = 100
  ): Observable<PagedResult<CancellationResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<PagedResult<CancellationResponse>>(
      this.apiUrl,
      { params }
    );
  }

  // Approve or reject cancellation request (Admin)
  reviewRequest(
    requestId: number,
    approve: boolean,
    request: ReviewCancellationRequest
  ): Observable<CancellationResponse> {
    const action = approve ? 'approve' : 'reject';

    return this.http.put<CancellationResponse>(
      `${this.apiUrl}/${requestId}/${action}`,
      request
    );
  }
}
