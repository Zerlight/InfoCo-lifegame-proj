declare module "*.worker.ts?worker" {
  const WorkerFactory: {
    new (): Worker;
  };
  export default WorkerFactory;
}