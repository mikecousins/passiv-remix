import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, redirect, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { authenticator, passwordLogin } from '~/services/auth.server';
import { commitSession, getSession } from '~/services/session.server';

const schema = z.object({
  email: z.string(),
  password: z.string(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.isAuthenticated(request, {
    successRedirect: '/',
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  // Send the submission back to the client if the status is not successful
  if (submission.status !== 'success') {
    return submission.reply();
  }

  const { email, password } = submission.value;
  const response = await passwordLogin(email, password);
  console.log(response.data);

  if (response.data.mfa_required.state) {
    const session = await getSession(request.headers.get('Cookie'));
    session.set('mfa_state', response.data.mfa_required.state);
    return redirect('/twoFactor', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }
}

export default function Screen() {
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    shouldValidate: 'onBlur',
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });
  return (
    <Form method="post" id={form.id} onSubmit={form.onSubmit}>
      <input type="email" name={fields.email.name} required />
      <input
        type="password"
        name={fields.password.name}
        autoComplete="current-password"
        required
      />
      <button>Sign In</button>
    </Form>
  );
}
