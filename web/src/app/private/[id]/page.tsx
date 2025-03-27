export default async function PrivatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const data = await MOCK_API(id);

  if (data === '15') {
    throw new Error('Error. ID is 15');
  }

  return (
    <div>
      PrivatePage ID: {id} DATA: {data}
    </div>
  );
}

const MOCK_API = (id: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(id);
    }, 3000);
  });
};
