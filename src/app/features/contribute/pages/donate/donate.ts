import { Component, computed, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-donate',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './donate.html',
  styleUrls: ['./donate.css']
})
export class DonatePage implements OnInit {

  submitted = signal(false);

  form!: FormGroup;

  showName = signal<boolean>(true);

  quickAmounts = [50, 100, 200, 300];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      isFirstTime: [true],
      name: [''],
      mobile: ['', [
        Validators.required,
        Validators.pattern(/^[6-9]\d{9}$/)
      ]],
      amount: [null, [
        Validators.required,
        Validators.min(1)
      ]]
    });

    // initialize showName signal from form control and update it on changes
    this.showName.set(this.form.controls['isFirstTime'].value === true);
    this.form.controls['isFirstTime'].valueChanges.subscribe((v) => {
      this.showName.set(v === true);
    });
  }

  ngOnInit() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const savedMobile = localStorage.getItem('donor_mobile');

    if (savedMobile) {
      this.form.patchValue({
        mobile: savedMobile,
        isFirstTime: false
      });
    }
  }

  selectAmount(amount: number) {
    this.form.controls['amount'].setValue(amount);
  }

  donate() {
  this.submitted.set(true);

  if (this.form.invalid) {
    return;
  }

  // Save mobile for repeat donor experience
  localStorage.setItem('donor_mobile', this.form.value.mobile!);

  // Generate UPI deep link
  const upiLink = this.generateUpiLink();
if (this.isMobileDevice()) {
  // Small delay helps mobile browsers
  setTimeout(() => {
    window.location.href = upiLink;
    console.log('Redirecting to UPI link:', upiLink);
  }, 300);
}else {
    // 🖥 Desktop → show QR / instructions
    alert(
      'UPI payment works on mobile phones only.\n\n' +
      'Please open this link on your mobile or scan the QR code.'
    );

    // Optional: open QR page (next step)
    console.log('UPI LINK:', upiLink);
  }
  }
  

  get f() {
    return this.form.controls as any;
  }

  private generateUpiLink(): string {
  const value = this.form.value;

  const upiId = 'chrispreethi@ybl'; // TODO: replace
  const payeeName = 'Chris Preethi Foundation'; // TODO: replace

  const amount = value.amount;
  const name = value.name || 'Donor';
  const mobile = value.mobile;

  // Transaction note (VERY IMPORTANT for verification)
  const note = `${name}-${mobile}`;

  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount,
    cu: 'INR',
    tn: note
  });

  return `upi://pay?${params.toString()}`;
}
private isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
}
