
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { EnrollmentService } from '../../enrollments/enrollment.service';
import { EnrollmentResponse } from '../../enrollments/enrollment.models';

import {
  CancellationRequestService,
} from '../../enrollments/cancellation-req.service';

import {
  CancellationResponse,
} from '../../enrollments/cancellation-req.model';

@Component({
  selector: 'app-cancellation-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cancellation-requests.html',
  styleUrl: './canvellation-req.css',
})
export class CancellationRequests implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly cancellationService = inject(CancellationRequestService);

  enrollments: EnrollmentResponse[] = [];

  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  selectedEnrollmentId: number | null = null;
  reason = '';

  ngOnInit(): void {
    this.loadRequests();
  }

  // Load active enrollments and cancellation request history.
  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      enrollmentResponse: this.enrollmentService.getMyEnrollments(1, 100),
      requestResponse: this.cancellationService.getMine(1, 100),
    })
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          // Backend enum: Active = 0, Cancelled = 1.
          this.enrollments = (
            response.enrollmentResponse.items ?? []
          ).filter(
            (enrollment: EnrollmentResponse) => enrollment.status === 0
          );

          this.requests.set(response.requestResponse.items ?? []);
        },

        error: (error) => {
          console.error('Failed to load cancellation page:', error);

          this.errorMessage.set(
            error.error?.detail ||
            error.error?.message ||
            'Unable to load cancellation requests. Please refresh the page.'
          );
        },
      });
  }

  // Keep the previous method name available if another template uses it.
  loadData(): void {
    this.loadRequests();
  }

  // Check whether an enrollment already has a pending request.
  hasPendingRequest(enrollmentId: number): boolean {
    return this.requests().some(
      (request) =>
        request.enrollmentId === enrollmentId &&
        request.status === 0
    );
  }

  // Submit a cancellation request.
  submitRequest(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.selectedEnrollmentId === null) {
      this.errorMessage.set('Please select a course.');
      return;
    }

    if (!this.reason.trim()) {
      this.errorMessage.set('Please enter a cancellation reason.');
      return;
    }

    const enrollmentId = this.selectedEnrollmentId;

    if (
      !this.enrollments.some(
        (enrollment) => enrollment.enrollmentId === enrollmentId
      )
    ) {
      this.errorMessage.set('Please select a valid active enrollment.');
      return;
    }

    if (this.hasPendingRequest(enrollmentId)) {
      this.errorMessage.set(
        'A pending cancellation request already exists for this course.'
      );
      return;
    }

    this.isSubmitting.set(true);

    this.cancellationService
      .create(enrollmentId, {
        reason: this.reason.trim(),
      })
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.successMessage.set(
            'Cancellation request submitted successfully.'
          );

          this.reason = '';
          this.selectedEnrollmentId = null;

          this.loadRequests();
        },

        error: (error) => {
          console.error('Cancellation submission failed:', error);

          this.errorMessage.set(
            error.error?.detail ||
            error.error?.message ||
            'Unable to submit cancellation request.'
          );
        },
      });
  }

  // Display request status.
  statusLabel(status: number): string {
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

  // Keep the previous method name available if needed.
  getStatus(status: number): string {
    return this.statusLabel(status);
  }
}
