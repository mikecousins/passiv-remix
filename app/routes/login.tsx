import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs } from '@remix-run/node';
import { Form, redirect, useActionData, useNavigation } from '@remix-run/react';
import { z } from 'zod';
import { Button } from '~/components/button';
import {
  Field,
  FieldGroup,
  Fieldset,
  Label,
  Legend,
} from '~/components/fieldset';
import { Input } from '~/components/input';
import { passwordLogin } from '~/services/auth.server';
import { commitSession, getSession } from '~/services/session.server';

const schema = z.object({
  email: z.string(),
  password: z.string(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  // Send the submission back to the client if the status is not successful
  if (submission.status !== 'success') {
    return submission.reply();
  }

  const { email, password } = submission.value;
  const response = await passwordLogin(email, password);

  if (response.data.mfa_required.state) {
    const session = await getSession(request.headers.get('Cookie'));
    session.set('mfa_state', response.data.mfa_required.state);
    return redirect('/twoFactor', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }
};

const LoginPage = () => {
  const { state } = useNavigation();
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    shouldValidate: 'onBlur',
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <div className="max-w-xl mx-auto py-8">
      <Form method="post" id={form.id} onSubmit={form.onSubmit}>
        <Fieldset>
          <Legend>Login</Legend>
          <FieldGroup>
            <Field>
              <Label>Email</Label>
              <Input type="email" name={fields.email.name} required />
            </Field>
            <Field>
              <Label>Password</Label>
              <Input
                type="password"
                name={fields.password.name}
                autoComplete="current-password"
                required
              />
            </Field>
            <Button type="submit" disabled={state === 'submitting'}>
              Sign In
            </Button>
          </FieldGroup>
        </Fieldset>
      </Form>
    </div>
  );
};

export default LoginPage;
