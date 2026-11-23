
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-cancellation-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css'
})
export class CancellationRequests implements OnInit {

  private apiUrl = 'https://localhost:52546/api/cancellation-requests';

  requests: any[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  get headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`
    });
  }

  loadRequests(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<any>(this.apiUrl, {
      headers: this.headers
    }).subscribe({
      next: (response) => {
        this.requests = response.items ?? [];
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to load cancellation requests.';
        this.loading = false;
      }
    });
  }

  approveRequest(id: number): void {
    if (!confirm('Are you sure you want to approve this cancellation?')) return;

    this.http.put(`${this.apiUrl}/${id}/approve`, {}, {
      headers: this.headers
    }).subscribe({
      next: () => {
        this.successMessage = 'Cancellation approved successfully.';
        this.loadRequests();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to approve cancellation.';
      }
    });
  }

  rejectRequest(id: number): void {
    if (!confirm('Are you sure you want to reject this cancellation?')) return;

    this.http.put(`${this.apiUrl}/${id}/reject`, {}, {
      headers: this.headers
    }).subscribe({
      next: () => {
        this.successMessage = 'Cancellation rejected successfully.';
        this.loadRequests();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Unable to reject cancellation.';
      }
    });
  }
}
