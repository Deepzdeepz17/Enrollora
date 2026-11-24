
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import { EnrollmentResponse } from '../../enrollment.models';
import { EnrollmentService } from '../../enrollment.service';

import { CancellationRequestService } from '../../cancellation-req.service';
import {
  CancellationResponse,
  CancellationStatus,
} from '../../cancellation-req.model';

@Component({
  selector: 'app-my-enrollments',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './my-enrollments.css',
  templateUrl: './my-enrollments.html',
})
export class MyEnrollments implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly cancellationService = inject(CancellationRequestService);

  enrollments = signal<EnrollmentResponse[]>([]);
  cancellationRequests = signal<CancellationResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  requestingId = signal<number | null>(null);
  reason = signal('');
  requestError = signal('');
  requestSuccess = signal('');
  submitting = signal(false);

  ngOnInit(): void {
    this.loadEnrollments();
    this.loadCancellationRequests();
  }

  // Load the logged-in student's enrollments.
  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getMyEnrollments(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.enrollments.set(response.items ?? []);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;

          this.errorMessage.set(
            body?.detail ||
            body?.message ||
            body?.title ||
            'Unable to load your enrollments.'
          );

          this.isLoading.set(false);
        },
      });
  }

  // Load the student's cancellation request history.
  loadCancellationRequests(): void {
    this.cancellationService.getMine().subscribe({
      next: (response) => {
        this.cancellationRequests.set(response.items ?? []);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Unable to load cancellation requests:', error);
      },
    });
  }

  // Display enrollment status.
  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Cancelled';
  }

  // Find the cancellation request associated with an enrollment.
  getCancellationRequest(
    enrollmentId: number
  ): CancellationResponse | undefined {
    return this.cancellationRequests().find(
      request => request.enrollmentId === enrollmentId
    );
  }

  // Open the cancellation request form.
  startRequest(enrollmentId: number): void {
    this.requestingId.set(enrollmentId);
    this.reason.set('');
    this.requestError.set('');
    this.requestSuccess.set('');
  }

  // Close the cancellation request form.
  closeRequest(): void {
    this.requestingId.set(null);
    this.reason.set('');
    this.requestError.set('');
  }

  // Submit a cancellation request.
  submitCancellation(enrollmentId: number): void {
    const reason = this.reason().trim();

    if (!reason) {
      this.requestError.set('Please enter a reason for cancellation.');
      return;
    }

    if (reason.length > 1000) {
      this.requestError.set('Reason cannot exceed 1000 characters.');
      return;
    }

    this.submitting.set(true);
    this.requestError.set('');

    this.cancellationService.create(enrollmentId, { reason }).subscribe({
      next: () => {
        this.submitting.set(false);

        this.requestSuccess.set(
          'Cancellation request submitted successfully.'
        );

        this.closeRequest();
        this.loadCancellationRequests();
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error;

        this.requestError.set(
          body?.detail ||
          body?.message ||
          body?.title ||
          'Unable to submit cancellation request.'
        );

        this.submitting.set(false);
      },
    });
  }

  // Check whether another cancellation request can be submitted.
  canRequestCancellation(enrollment: EnrollmentResponse): boolean {
    if (enrollment.status !== 0) {
      return false;
    }

    const request = this.getCancellationRequest(
      enrollment.enrollmentId
    );

    // Pending or approved requests prevent another request.
    // Rejected requests allow the student to submit again.
    return !request ||
      request.status === CancellationStatus.Rejected;
  }

  // Go to the previous page.
  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(page => page - 1);
      this.loadEnrollments();
    }
  }

  // Go to the next page.
  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update(page => page + 1);
      this.loadEnrollments();
    }
  }
}
