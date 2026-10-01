<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('seed_lot_no');
            $table->string('accession')->nullable();
            $table->string('collection_no');
            $table->string('accession_name');

            $table->date('date_sown');
            $table->date('reading_date');

            $table->unsignedTinyInteger('replicate_number');

            $table->unsignedInteger('normal_count')->default(0);
            $table->unsignedInteger('abnormal_count')->default(0);
            $table->unsignedInteger('dead_count')->default(0);
            $table->unsignedInteger('total_count')->default(0);

            $table->decimal('viability', 5, 1)->default(0);
            $table->unsignedTinyInteger('predicted_germination')
                ->default(0);

            $table->string('image_path')->nullable();

            $table->timestamps();

            $table->index([
                'seed_lot_no',
                'replicate_number',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};