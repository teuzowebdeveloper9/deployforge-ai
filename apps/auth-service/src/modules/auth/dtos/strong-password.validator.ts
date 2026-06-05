import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from "class-validator";
import { passwordPolicyMessage, validatePasswordPolicy } from "../../../shared/security/password-policy";

@ValidatorConstraint({ name: "isStrongPassword", async: false })
class StrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return typeof value === "string" && validatePasswordPolicy(value).valid;
  }

  defaultMessage() {
    return passwordPolicyMessage();
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function registerStrongPassword(target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: StrongPasswordConstraint
    });
  };
}
