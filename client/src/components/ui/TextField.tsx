// A labelled input with an error message. Works with react-hook-form:
//   <TextField label="Email" error={errors.email?.message} {...register("email")} />

type TextFieldProps = React.ComponentProps<"input"> & {
  label: string;
  error?: string;
  hint?: string;
  trailing?: React.ReactNode; // for example the show/hide password button
};

export function TextField({ label, error, hint, trailing, id, ...props }: TextFieldProps) {
  const inputId = id ?? props.name;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-forest">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`h-12 w-full rounded-full border-2 bg-cream px-5 text-forest placeholder:text-brown/50 ${
            error ? "border-terracotta" : "border-sand-dark"
          } ${trailing ? "pr-14" : ""}`}
          {...props}
        />
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-terracotta">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-brown">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
