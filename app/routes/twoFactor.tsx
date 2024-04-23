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
import { tokenLogin } from '~/services/auth.server';
import { commitSession, getSession } from '~/services/session.server';

const schema = z.object({
  token: z.string(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  // Send the submission back to the client if the status is not successful
  if (submission.status !== 'success') {
    return submission.reply();
  }

  const { token } = submission.value;
  const session = await getSession(request.headers.get('Cookie'));
  const response = await tokenLogin(token, session.get('mfa_state'));

  if (response.data.token) {
    session.set('jwt_token', response.data.token);
    return redirect('/', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }
};

const TwoFactorPage = () => {
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
          <Legend>Two Factor</Legend>
          <FieldGroup>
            <Field>
              <Label>Token</Label>
              <Input type="token" name={fields.token.name} required />
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

export default TwoFactorPage;
