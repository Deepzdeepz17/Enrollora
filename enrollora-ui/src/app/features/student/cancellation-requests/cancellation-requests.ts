
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  CancellationRequestService,
  CancellationResponse,
} from '../../student/cancellation-requests/cancellation-request.service';

@Component({
  selector: 'app-admin-cancellation-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cancellation-requests.html',
})
export class AdminCancellationRequests implements OnInit {
  private cancellationService = inject(CancellationRequestService);

  requests: CancellationResponse[] = [];
  isLoading = false;
  isReviewing = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.cancellationService.getAllRequests(1, 100).subscribe({
      next: (response) => {
        this.requests = response.items;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load requests:', error);
        this.errorMessage = 'Unable to load cancellation requests.';
        this.isLoading = false;
      },
    });
  }

  reviewRequest(requestId: number, approve: boolean): void {
    const action = approve ? 'approve' : 'reject';

    const remarks = window.prompt(
      `Enter admin remarks for ${action} (optional):`,
    );

    if (remarks === null) {
      return;
    }

    this.isReviewing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.cancellationService
      .reviewRequest(requestId, approve, { adminRemarks: remarks })
      .subscribe({
        next: () => {
          this.successMessage = `Cancellation request ${action}d successfully.`;
          this.isReviewing = false;
          this.loadRequests();
        },
        error: (error) => {
          console.error('Review failed:', error);
          this.errorMessage =
            error.error?.detail || 'Unable to review cancellation request.';
          this.isReviewing = false;
        },
      });
  }

  getStatus(status: number): string {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Approved';
      case 2:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }
}
