import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, IndianRupee, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-yellow-600" />
            <span className="text-2xl font-bold text-gray-800">MSME Analytics</span>
          </div>
          <Link href="/login">
            <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">Login</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">
          Empower Your <span className="text-yellow-600">MSME Business</span> with Data-Driven Insights
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Transform your small business with comprehensive sales analytics, real-time reporting, and actionable insights
          that drive growth and profitability.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Everything You Need to Scale Your Business
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-yellow-600 mb-4" />
              <CardTitle className="text-gray-800">Sales Analytics</CardTitle>
              <CardDescription className="text-gray-600">
                Track revenue, orders, and growth trends with interactive charts and real-time data.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-yellow-600 mb-4" />
              <CardTitle className="text-gray-800">Customer Insights</CardTitle>
              <CardDescription className="text-gray-600">
                Understand your customers better with detailed analytics and behavioral patterns.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <IndianRupee className="h-12 w-12 text-yellow-600 mb-4" />
              <CardTitle className="text-gray-800">Financial Reports</CardTitle>
              <CardDescription className="text-gray-600">
                Generate comprehensive financial reports and track your business performance.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of MSME businesses already using our platform to drive growth.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white">
              Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 MSME Analytics. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
