import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const EMAIL_MAX_LENGTH = 254;
const NAME_MAX_LENGTH = 150;
const EGYPTIAN_PHONE_REGEX = /^01[0125][0-9]{8}$/;
const PHONE_LENGTH = 11;
const PASSWORD_MIN_LENGTH = 8;

type SignupRole = 'patient' | 'doctor' | 'receptionist';

export class AuthValidators {
  static emailMaxLength(): number {
    return EMAIL_MAX_LENGTH;
  }

  static nameMaxLength(): number {
    return NAME_MAX_LENGTH;
  }

  static phoneLength(): number {
    return PHONE_LENGTH;
  }

  static passwordMinLength(): number {
    return PASSWORD_MIN_LENGTH;
  }

  static isSignupRole(value: unknown): value is SignupRole {
    return value === 'patient' || value === 'doctor' || value === 'receptionist';
  }

  static pastDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      const chosen = new Date(value as string);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(chosen.getTime()) || chosen >= today) {
        return { pastDate: true };
      }
      return null;
    };
  }

  static egyptianPhoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value ?? '').trim();
      if (!value) {
        return null;
      }
      if (value.length !== PHONE_LENGTH) {
        return { phoneLength: true };
      }
      if (!EGYPTIAN_PHONE_REGEX.test(value)) {
        return { phoneEgyptian: true };
      }
      return null;
    };
  }

  static passwordNotAllNumeric(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value ?? '');
      if (!value) {
        return null;
      }
      if (/^[0-9]+$/.test(value)) {
        return { passwordNumeric: true };
      }
      return null;
    };
  }

  static signupPasswordPolicy(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const group = control as {
        get(path: string): AbstractControl | null;
        value: Record<string, unknown>;
      };
      const passwordControl = group.get('password');
      const confirmControl = group.get('confirm_password');
      if (!passwordControl || !confirmControl) {
        return null;
      }
      const password = String(passwordControl.value ?? '');
      const confirmPassword = String(confirmControl.value ?? '');
      const email = String(group.get('email')?.value ?? '');
      const firstName = String(group.get('first_name')?.value ?? '');
      const lastName = String(group.get('last_name')?.value ?? '');
      const hasMismatch = Boolean(confirmPassword) && password !== confirmPassword;
      const similarityTokens = AuthValidators.collectSimilarityTokens({
        email,
        firstName,
        lastName,
      });
      const isTooSimilar = AuthValidators.isPasswordTooSimilar({
        password,
        tokens: similarityTokens,
      });
      const errors: Record<string, true> = {};
      if (hasMismatch) {
        errors['passwordMismatch'] = true;
      }
      if (password && isTooSimilar) {
        errors['passwordSimilar'] = true;
      }
      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  private static collectSimilarityTokens(input: {
    email: string;
    firstName: string;
    lastName: string;
  }): string[] {
    const email = input.email.trim().toLowerCase();
    const emailLocal = email.includes('@') ? email.split('@')[0] : email;
    const tokens = [
      emailLocal,
      input.firstName.trim().toLowerCase(),
      input.lastName.trim().toLowerCase(),
    ].filter((x) => x.length >= 3);
    return Array.from(new Set(tokens));
  }

  private static isPasswordTooSimilar(input: { password: string; tokens: string[] }): boolean {
    const password = input.password.toLowerCase();
    if (!password) {
      return false;
    }
    for (const token of input.tokens) {
      if (token.length < 3) {
        continue;
      }
      if (password.includes(token)) {
        return true;
      }
    }
    return false;
  }
}
