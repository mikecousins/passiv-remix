import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs } from '@remix-run/node';
import { Form, redirect, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { tokenLogin } from '~/services/auth.server';
import { commitSession, getSession } from '~/services/session.server';

const schema = z.object({
  token: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  // Send the submission back to the client if the status is not successful
  if (submission.status !== 'success') {
    return submission.reply();
  }

  const { token } = submission.value;
  const session = await getSession(request.headers.get('Cookie'));
  const response = await tokenLogin(token, session.get('mfa_state'));
  console.log(response.data);

  if (response.data.token) {
    session.set('jwt_token', response.data.token);
    return redirect('/', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }
}

export default function TwoFactorPage() {
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
      <input type="token" name={fields.token.name} required />
      <button>Sign In</button>
    </Form>
  );
}
