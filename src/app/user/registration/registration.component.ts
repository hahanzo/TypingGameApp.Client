import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { FirstKeyPipe } from '../../shared/pipes/first-key.pipe';
import { AuthService } from '../../shared/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FirstKeyPipe,RouterLink],
  templateUrl: './registration.component.html',
  styles: ``
})
export class RegistrationComponent {
  constructor(
    public formBuilder: FormBuilder,
    private service: AuthService,
    private toastr:ToastrService) {}
  
  isSubmitted: boolean = false

  passwordMatchValidator: ValidatorFn = (control:AbstractControl):null => {
    const password = control.get('password')
    const confirmPassword = control.get('confirmPassword')

    if(password && confirmPassword && password.value != confirmPassword.value)
      confirmPassword?.setErrors({passwordMismatch:true})
    else
      confirmPassword?.setErrors(null)
      
    return null
  }
 
  form = this.formBuilder.group({
    username : ['',Validators.required],
    email : ['',[Validators.required, Validators.email]],
    password : ['',[
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(/(?=.*[^a-zA-Z0-9])/)]],
    confirmPassword : [''],
  },{validators:this.passwordMatchValidator})
  
  

  onSubmit() {
    this.isSubmitted = true;
    if(this.form.valid){
      
      const formData = {
        ...this.form.value,
        registeredOn: new Date().toISOString()
      };

      console.log(formData)
      
      this.service.createUser(formData)
      .subscribe({
        next:(res:any) => {
          if(res.succeeded){
            this.form.reset();
            this.isSubmitted = false;
            this.toastr.success('New user created!','Registration Successful')
          }
          else
            console.log('response:',res);
        },
        error:err => console.log('error',err)
      });
    }
  }

  hasDisplayableError(contorlName: string):Boolean {
    const control = this.form.get(contorlName)
    return Boolean(control?.invalid) &&
      (this.isSubmitted || Boolean(control?.touched))
  }
}
