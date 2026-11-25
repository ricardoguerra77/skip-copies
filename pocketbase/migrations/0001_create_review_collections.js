/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const reviews = new Collection({
      name: 'reviews',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != '' && @request.body.user_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true, max: 240 },
        {
          name: 'source',
          type: 'select',
          required: true,
          values: ['google_docs', 'manual'],
          maxSelect: 1,
        },
        { name: 'source_doc_id', type: 'text', max: 240 },
        { name: 'source_doc_name', type: 'text', max: 240 },
        { name: 'source_doc_link', type: 'url' },
        { name: 'copywriter', type: 'text', required: true, max: 160 },
        { name: 'copy_text', type: 'editor', required: true, maxSize: 500000 },
        { name: 'score_hook', type: 'number', min: 0, max: 10 },
        { name: 'score_argument', type: 'number', min: 0, max: 10 },
        { name: 'score_curiosity', type: 'number', min: 0, max: 10 },
        { name: 'score_overall', type: 'number', min: 0, max: 10 },
        {
          name: 'status',
          type: 'select',
          values: ['pronta', 'pequenos_ajustes', 'ajustes_relevantes', 'refazer'],
          maxSelect: 1,
        },
        { name: 'analysis_hook', type: 'json', maxSize: 200000 },
        { name: 'analysis_argument', type: 'json', maxSize: 200000 },
        { name: 'analysis_curiosity', type: 'json', maxSize: 200000 },
        { name: 'consolidation', type: 'json', maxSize: 250000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_reviews_user_created ON reviews (user_id, created DESC)'],
    })
    app.save(reviews)

    const tasks = new Collection({
      name: 'tasks',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != '' && @request.body.user_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'review_id',
          type: 'relation',
          required: true,
          collectionId: reviews.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true, max: 240 },
        { name: 'description', type: 'editor', required: true, maxSize: 20000 },
        { name: 'original_text', type: 'editor', maxSize: 30000 },
        { name: 'suggestion', type: 'editor', required: true, maxSize: 30000 },
        {
          name: 'priority',
          type: 'select',
          required: true,
          values: ['alta', 'media', 'baixa'],
          maxSelect: 1,
        },
        {
          name: 'criterion',
          type: 'select',
          required: true,
          values: ['hook', 'argumento', 'curiosidade', 'cta'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'em_andamento', 'concluida', 'cancelada'],
          maxSelect: 1,
        },
        { name: 'copywriter', type: 'text', required: true, max: 160 },
        { name: 'source_doc_name', type: 'text', max: 240 },
        { name: 'source_doc_link', type: 'url' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_tasks_user_status ON tasks (user_id, status)',
        'CREATE INDEX idx_tasks_review ON tasks (review_id)',
      ],
    })
    app.save(tasks)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('tasks'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('reviews'))
    } catch (_) {}
  },
)
